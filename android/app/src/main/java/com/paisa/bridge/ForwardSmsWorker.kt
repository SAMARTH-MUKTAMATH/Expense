package com.paisa.bridge

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

class ForwardSmsWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    companion object {
        const val KEY_SENDER = "sender"
        const val KEY_BODY = "body"
        const val KEY_RECEIVED_AT = "receivedAt"
        private const val MAX_ATTEMPTS = 8
        private const val TIMEOUT_MS = 15_000
        private val STAMP = DateTimeFormatter.ofPattern("d MMM, HH:mm", Locale.ENGLISH)
    }

    override fun doWork(): Result {
        val store = TokenStore(applicationContext)
        val token = store.token ?: return Result.failure()
        val apiUrl = store.apiUrl ?: return Result.failure()

        val receivedAt = inputData.getLong(KEY_RECEIVED_AT, System.currentTimeMillis())
        val payload = JSONObject()
            .put("sender", inputData.getString(KEY_SENDER))
            .put("body", inputData.getString(KEY_BODY))
            .put("receivedAt", Instant.ofEpochMilli(receivedAt).toString())

        return try {
            val connection = (URL(apiUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                doOutput = true
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Content-Type", "application/json")
            }
            connection.outputStream.use { it.write(payload.toString().toByteArray()) }
            val code = connection.responseCode
            val stream = if (code < 400) connection.inputStream else connection.errorStream
            val responseBody = runCatching { stream?.bufferedReader()?.readText() }.getOrNull() ?: ""
            connection.disconnect()
            handleResponse(store, code, responseBody)
        } catch (e: IOException) {
            retryOrGiveUp(store, "no network, will retry")
        }
    }

    private fun handleResponse(store: TokenStore, code: Int, body: String): Result = when {
        code == 401 -> {
            store.clear()
            Result.failure()
        }
        code == 429 || code >= 500 -> retryOrGiveUp(store, "server busy, will retry")
        code in 200..299 -> {
            store.lastResult = describe(body)
            Result.success()
        }
        else -> {
            store.lastResult = "rejected ($code) at ${now()}"
            Result.failure()
        }
    }

    private fun retryOrGiveUp(store: TokenStore, note: String): Result {
        if (runAttemptCount >= MAX_ATTEMPTS) {
            store.lastResult = "gave up after $MAX_ATTEMPTS tries at ${now()}"
            return Result.failure()
        }
        store.lastResult = note
        return Result.retry()
    }

    private fun describe(body: String): String {
        val json = runCatching { JSONObject(body) }.getOrNull() ?: return "sent at ${now()}"
        return when {
            json.optBoolean("created") -> {
                val amount = String.format(Locale.ENGLISH, "%.2f", json.optDouble("amount"))
                val type = json.optString("type").lowercase(Locale.ENGLISH)
                "logged ₹$amount $type at ${now()}"
            }
            json.optBoolean("duplicate") -> "already logged, skipped at ${now()}"
            json.optBoolean("ignored") -> "skipped (${json.optString("reason")}) at ${now()}"
            else -> "sent at ${now()}"
        }
    }

    private fun now(): String = STAMP.format(Instant.now().atZone(ZoneId.systemDefault()))
}
