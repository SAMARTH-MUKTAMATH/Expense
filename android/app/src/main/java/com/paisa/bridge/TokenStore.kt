package com.paisa.bridge

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager

private const val PREFS = "bridge"
private const val KEY_TOKEN = "token"
private const val KEY_PENDING_STATE = "pendingState"

class TokenStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    var pendingState: String?
        get() = prefs.getString(KEY_PENDING_STATE, null)
        set(value) = prefs.edit().putString(KEY_PENDING_STATE, value).apply()

    val isConnected: Boolean
        get() = !token.isNullOrBlank()

    fun clear() = prefs.edit().clear().apply()
}

fun Context.hasSmsPermission() =
    checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED

fun Context.isTrackingOn() = TokenStore(this).isConnected && hasSmsPermission()
