package com.paisa.bridge

import android.content.Context
import android.util.Log

private const val PREFS = "crash"
private const val KEY_LAST = "last"
private const val MAX_TRACE_CHARS = 1500

object CrashLog {
    fun install(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, error ->
            prefs.edit().putString(KEY_LAST, Log.getStackTraceString(error).take(MAX_TRACE_CHARS)).commit()
            previous?.uncaughtException(thread, error)
        }
    }

    fun last(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_LAST, null)
}
