package com.paisa.bridge

import android.content.Context

private const val PREFS = "bridge"
private const val KEY_TOKEN = "token"
private const val KEY_PENDING_STATE = "pendingState"
private const val KEY_LAST_RESULT = "lastResult"

class TokenStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    var pendingState: String?
        get() = prefs.getString(KEY_PENDING_STATE, null)
        set(value) = prefs.edit().putString(KEY_PENDING_STATE, value).apply()

    var lastResult: String?
        get() = prefs.getString(KEY_LAST_RESULT, null)
        set(value) = prefs.edit().putString(KEY_LAST_RESULT, value).apply()

    val isConnected: Boolean
        get() = !token.isNullOrBlank()

    fun clear() = prefs.edit().clear().apply()
}
