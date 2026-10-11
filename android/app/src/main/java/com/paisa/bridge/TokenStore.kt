package com.paisa.bridge

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager

private const val PREFS = "bridge"
private const val KEY_TOKEN = "token"
private const val KEY_PENDING_STATE = "pendingState"
private const val KEY_INBOX_SYNCED_UNTIL = "inboxSyncedUntil"

class TokenStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    var pendingState: String?
        get() = prefs.getString(KEY_PENDING_STATE, null)
        set(value) = prefs.edit().putString(KEY_PENDING_STATE, value).apply()

    var inboxSyncedUntil: Long?
        get() = prefs.getLong(KEY_INBOX_SYNCED_UNTIL, 0).takeIf { it > 0 }
        set(value) = prefs.edit().putLong(KEY_INBOX_SYNCED_UNTIL, value ?: 0).apply()

    val isConnected: Boolean
        get() = !token.isNullOrBlank()

    fun clear() = prefs.edit().clear().apply()
}

val SMS_PERMISSIONS = arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS)

fun Context.hasSmsPermission() =
    SMS_PERMISSIONS.all { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }

fun Context.isTrackingOn() = TokenStore(this).isConnected && hasSmsPermission()
