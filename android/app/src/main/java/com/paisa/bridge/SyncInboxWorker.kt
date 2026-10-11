package com.paisa.bridge

import android.content.Context
import android.provider.Telephony
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.io.IOException
import java.util.concurrent.TimeUnit

private const val SYNC_NOW = "inbox-sync"
private const val SYNC_PERIODIC = "inbox-sync-periodic"
private const val PERIOD_MINUTES = 15L
private const val MAX_LOOKBACK_MS = 30L * 86_400_000

// SmsReceiver forwards fresh messages itself
private const val SETTLE_MS = 2 * 60_000L

private val syncLock = Any()

fun scheduleInboxSync(context: Context) {
    val online = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
    val work = WorkManager.getInstance(context)

    work.enqueueUniqueWork(
        SYNC_NOW,
        ExistingWorkPolicy.KEEP,
        OneTimeWorkRequest.Builder(SyncInboxWorker::class.java)
            .setConstraints(online)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
    )
    work.enqueueUniquePeriodicWork(
        SYNC_PERIODIC,
        ExistingPeriodicWorkPolicy.KEEP,
        PeriodicWorkRequest.Builder(SyncInboxWorker::class.java, PERIOD_MINUTES, TimeUnit.MINUTES)
            .setConstraints(online)
            .build()
    )
}

class SyncInboxWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result = synchronized(syncLock) { sync() }

    private fun sync(): Result {
        val store = TokenStore(applicationContext)
        val token = store.token ?: return Result.failure()
        if (!applicationContext.hasSmsPermission()) return Result.failure()

        val now = System.currentTimeMillis()
        val until = now - SETTLE_MS
        val since = maxOf(store.inboxSyncedUntil ?: until, now - MAX_LOOKBACK_MS)
        if (since >= until) return Result.success()

        val cursor = applicationContext.contentResolver.query(
            Telephony.Sms.Inbox.CONTENT_URI,
            arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE),
            "${Telephony.Sms.DATE} > ? AND ${Telephony.Sms.DATE} <= ?",
            arrayOf(since.toString(), until.toString()),
            "${Telephony.Sms.DATE} ASC"
        ) ?: return Result.retry()

        cursor.use {
            while (it.moveToNext()) {
                val sender = it.getString(0) ?: ""
                val body = it.getString(1) ?: ""
                val receivedAt = it.getLong(2)

                if (shouldForward(sender, body)) {
                    val code = try {
                        postSms(token, sender, body, receivedAt)
                    } catch (e: IOException) {
                        return Result.retry()
                    }
                    if (code == 401) {
                        store.clear()
                        return Result.failure()
                    }
                    if (shouldRetry(code)) return Result.retry()
                }
                store.inboxSyncedUntil = receivedAt
            }
        }

        store.inboxSyncedUntil = until
        return Result.success()
    }
}
