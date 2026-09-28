package com.paisa.bridge

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.trusted.TrustedWebActivityIntentBuilder
import com.google.androidbrowserhelper.trusted.TwaLauncher
import java.security.SecureRandom

private const val SMS_PERMISSION_REQUEST = 1
private const val INK = "#0A0A0A"

class TrackingActivity : Activity() {
    private lateinit var store: TokenStore
    private var launcher: TwaLauncher? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = TokenStore(this)
        handle(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handle(intent)
    }

    override fun onDestroy() {
        launcher?.destroy()
        super.onDestroy()
    }

    private fun handle(intent: Intent?) {
        val data = intent?.data
        when (data?.host) {
            "start" -> onStartRequested()
            "connect" -> onConnectLink(data)
            else -> finish()
        }
    }

    private fun onStartRequested() {
        when {
            isTrackingOn() -> openInApp(Site.dashboardUri(trackingOn = true))
            hasSmsPermission() -> signIn()
            else -> showDisclosure()
        }
    }

    private fun showDisclosure() {
        AlertDialog.Builder(this)
            .setTitle("Allow BudgetFLOW to read bank SMS?")
            .setMessage(
                "BudgetFLOW reads SMS from your bank to add payments automatically, " +
                    "even when the app is closed.\n\n" +
                    "Only bank messages are sent to your BudgetFLOW account. " +
                    "Messages from people are ignored and never leave your phone."
            )
            .setPositiveButton("Continue") { _, _ ->
                requestPermissions(arrayOf(Manifest.permission.RECEIVE_SMS), SMS_PERMISSION_REQUEST)
            }
            .setNegativeButton("Not now") { _, _ -> finish() }
            .setOnCancelListener { finish() }
            .show()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != SMS_PERMISSION_REQUEST) return
        if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
            signIn()
        } else {
            showPermissionBlocked()
        }
    }

    private fun showPermissionBlocked() {
        AlertDialog.Builder(this)
            .setTitle("SMS access is off")
            .setMessage(
                "Auto tracking needs SMS access.\n\n" +
                    "If Android says the setting is restricted, open App settings, tap the ⋮ menu, " +
                    "choose Allow restricted settings, then tap Turn on again."
            )
            .setPositiveButton("App settings") { _, _ ->
                startActivity(
                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
                )
                finish()
            }
            .setNegativeButton("Close") { _, _ -> finish() }
            .setOnCancelListener { finish() }
            .show()
    }

    private fun signIn() {
        val state = newState()
        store.pendingState = state
        openInApp(Site.connectUri(state))
    }

    private fun onConnectLink(data: Uri) {
        val token = data.getQueryParameter("token")
        val state = data.getQueryParameter("state")
        val expected = store.pendingState
        if (token.isNullOrBlank() || expected == null || state != expected) {
            finish()
            return
        }
        store.token = token
        store.pendingState = null
        openInApp(Site.dashboardUri(trackingOn = true)) { requestBatteryExemption() }
    }

    private fun openInApp(uri: Uri, afterLaunch: () -> Unit = {}) {
        val colors = CustomTabColorSchemeParams.Builder()
            .setToolbarColor(Color.parseColor(INK))
            .setNavigationBarColor(Color.parseColor(INK))
            .build()
        val builder = TrustedWebActivityIntentBuilder(uri).setDefaultColorSchemeParams(colors)
        launcher = TwaLauncher(this).also {
            it.launch(builder, null, null, Runnable {
                afterLaunch()
                finish()
            })
        }
    }

    private fun requestBatteryExemption() {
        val power = getSystemService(PowerManager::class.java)
        if (power.isIgnoringBatteryOptimizations(packageName)) return
        startActivity(
            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))
        )
    }

    private fun newState(): String {
        val bytes = ByteArray(24)
        SecureRandom().nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
