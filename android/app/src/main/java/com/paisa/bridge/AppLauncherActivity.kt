package com.paisa.bridge

import android.app.AlertDialog
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import com.google.androidbrowserhelper.trusted.LauncherActivity
import com.google.androidbrowserhelper.trusted.TwaProviderPicker

class AppLauncherActivity : LauncherActivity() {
    override fun getLaunchingUrl(): Uri = Site.inAppUri(super.getLaunchingUrl(), isTrackingOn())

    // TODO: remove diagnostic dialog once launch closing is solved
    override fun shouldLaunchImmediately() = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (isFinishing) return
        AlertDialog.Builder(this)
            .setTitle("BudgetFLOW test")
            .setMessage(launchReport(this))
            .setPositiveButton("Open app") { _, _ -> launchTwa() }
            .setCancelable(false)
            .show()
    }
}

private fun launchReport(context: Context): String {
    val pick = TwaProviderPicker.pickProvider(context.packageManager)
    val browserVersion = pick.provider?.let {
        runCatching { context.packageManager.getPackageInfo(it, 0).versionName }.getOrNull()
    }
    return listOf(
        "Phone: ${Build.MANUFACTURER} ${Build.MODEL}, Android ${Build.VERSION.RELEASE}",
        "Browser: ${pick.provider ?: "none"} $browserVersion",
        "Launch mode: ${pick.launchMode}",
        "Last crash:\n${CrashLog.last(context) ?: "none"}",
    ).joinToString("\n\n")
}
