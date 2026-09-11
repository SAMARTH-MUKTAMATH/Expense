package com.paisa.bridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

private val PHONE_NUMBER = Regex("^\\+?[\\d\\s()-]+$")
private val SENDER_ID = Regex("^(?:[A-Z]{2}-)?[A-Z0-9]{4,9}(?:-[A-Z])?$")

fun looksLikeBankSender(sender: String): Boolean {
    val raw = sender.trim().uppercase()
    if (raw.isEmpty() || PHONE_NUMBER.matches(raw)) return false
    return SENDER_ID.matches(raw)
}

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        if (!TokenStore(context).isConnected) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val sender = messages[0].originatingAddress ?: return
        if (!looksLikeBankSender(sender)) return

        val body = messages.joinToString("") { it.messageBody ?: "" }
        if (body.isBlank()) return

        val input = Data.Builder()
            .putString(ForwardSmsWorker.KEY_SENDER, sender)
            .putString(ForwardSmsWorker.KEY_BODY, body)
            .putLong(ForwardSmsWorker.KEY_RECEIVED_AT, messages[0].timestampMillis)
            .build()

        val request = OneTimeWorkRequest.Builder(ForwardSmsWorker::class.java)
            .setInputData(input)
            .setConstraints(
                Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
            )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueue(request)
    }
}
