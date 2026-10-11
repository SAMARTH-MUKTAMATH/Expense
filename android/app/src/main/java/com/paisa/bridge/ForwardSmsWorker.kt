package com.paisa.bridge

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.io.IOException

class ForwardSmsWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    companion object {
        const val KEY_SENDER = "sender"
        const val KEY_BODY = "body"
        const val KEY_RECEIVED_AT = "receivedAt"
        private const val MAX_ATTEMPTS = 8
    }

    override fun doWork(): Result {
        val store = TokenStore(applicationContext)
        val token = store.token ?: return Result.failure()
        val sender = inputData.getString(KEY_SENDER) ?: return Result.failure()
        val body = inputData.getString(KEY_BODY) ?: return Result.failure()
        val receivedAt = inputData.getLong(KEY_RECEIVED_AT, System.currentTimeMillis())

        return try {
            val code = postSms(token, sender, body, receivedAt)
            when {
                code == 401 -> {
                    store.clear()
                    Result.failure()
                }
                shouldRetry(code) -> retryOrGiveUp()
                else -> Result.success()
            }
        } catch (e: IOException) {
            retryOrGiveUp()
        }
    }

    private fun retryOrGiveUp(): Result =
        if (runAttemptCount >= MAX_ATTEMPTS) Result.failure() else Result.retry()
}
