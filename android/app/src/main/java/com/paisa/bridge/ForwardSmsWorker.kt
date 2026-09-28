package com.paisa.bridge

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant

class ForwardSmsWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    companion object {
        const val KEY_SENDER = "sender"
        const val KEY_BODY = "body"
        const val KEY_RECEIVED_AT = "receivedAt"
        private const val MAX_ATTEMPTS = 8
        private const val TIMEOUT_MS = 15_000
    }

    override fun doWork(): Result {
        val store = TokenStore(applicationContext)
        val token = store.token ?: return Result.failure()

        val receivedAt = inputData.getLong(KEY_RECEIVED_AT, System.currentTimeMillis())
        val payload = JSONObject()
            .put("sender", inputData.getString(KEY_SENDER))
            .put("body", inputData.getString(KEY_BODY))
            .put("receivedAt", Instant.ofEpochMilli(receivedAt).toString())

        return try {
            val code = post(token, payload)
            when {
                code == 401 -> {
                    store.clear()
                    Result.failure()
                }
                code == 429 || code >= 500 -> retryOrGiveUp()
                else -> Result.success()
            }
        } catch (e: IOException) {
            retryOrGiveUp()
        }
    }

    private fun post(token: String, payload: JSONObject): Int {
        val connection = (URL(Site.ingestUrl).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = TIMEOUT_MS
            readTimeout = TIMEOUT_MS
            doOutput = true
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Content-Type", "application/json")
        }
        return try {
            connection.outputStream.use { it.write(payload.toString().toByteArray()) }
            connection.responseCode
        } finally {
            connection.disconnect()
        }
    }

    private fun retryOrGiveUp(): Result =
        if (runAttemptCount >= MAX_ATTEMPTS) Result.failure() else Result.retry()
}
