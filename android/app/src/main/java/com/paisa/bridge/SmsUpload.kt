package com.paisa.bridge

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant

private const val TIMEOUT_MS = 15_000
private val OTP_TEXT =
    Regex("\\botp\\b|one[\\s-]?time[\\s-]?password|verification code", RegexOption.IGNORE_CASE)

fun shouldForward(sender: String, body: String) =
    body.isNotBlank() && looksLikeBankSender(sender) && !OTP_TEXT.containsMatchIn(body)

fun shouldRetry(code: Int) = code == 429 || code >= 500

fun postSms(token: String, sender: String, body: String, receivedAt: Long): Int {
    val payload = JSONObject()
        .put("sender", sender)
        .put("body", body)
        .put("receivedAt", Instant.ofEpochMilli(receivedAt).toString())

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
