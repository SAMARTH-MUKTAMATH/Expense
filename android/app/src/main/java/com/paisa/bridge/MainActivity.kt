package com.paisa.bridge

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.TypedValue
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

private const val SMS_PERMISSION_REQUEST = 1
private const val INGEST_PATH = "/api/ingest/sms"

class MainActivity : Activity() {
    private lateinit var store: TokenStore
    private lateinit var status: TextView
    private lateinit var detail: TextView
    private lateinit var primary: Button
    private lateinit var appSettings: Button
    private lateinit var disconnect: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = TokenStore(this)
        setContentView(buildLayout())
        handleConnectLink(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleConnectLink(intent)
    }

    override fun onResume() {
        super.onResume()
        render()
    }

    private fun buildLayout(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0A0A0A"))
            setPadding(dp(24), dp(64), dp(24), dp(24))
        }

        val brand = TextView(this).apply {
            text = getString(R.string.app_name)
            setTextColor(Color.parseColor("#89E900"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
        }
        status = TextView(this).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 20f)
        }
        detail = TextView(this).apply {
            setTextColor(Color.parseColor("#A0A0A0"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
        }
        primary = Button(this)
        appSettings = Button(this).apply {
            text = "App settings"
            setOnClickListener {
                startActivity(
                    Intent(
                        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:$packageName")
                    )
                )
            }
        }
        disconnect = Button(this).apply {
            text = "Disconnect this phone"
            setOnClickListener {
                store.clear()
                render()
            }
        }

        root.addView(brand, row(dp(24)))
        root.addView(status, row(dp(8)))
        root.addView(detail, row(dp(24)))
        root.addView(primary, row(dp(8)))
        root.addView(appSettings, row(dp(8)))
        root.addView(disconnect, row(0))
        return root
    }

    private fun row(bottomMargin: Int) = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
    ).apply { this.bottomMargin = bottomMargin }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun handleConnectLink(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "paisa" || data.host != "connect") return
        val token = data.getQueryParameter("token")
        val api = data.getQueryParameter("api")
        if (token.isNullOrBlank() || api.isNullOrBlank() || !api.endsWith(INGEST_PATH)) return
        store.token = token
        store.apiUrl = api
        store.lastResult = null
        ensurePermissions()
    }

    private fun hasSmsPermission() =
        checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED

    private fun ensurePermissions() {
        if (!hasSmsPermission()) {
            requestPermissions(arrayOf(Manifest.permission.RECEIVE_SMS), SMS_PERMISSION_REQUEST)
            return
        }
        requestBatteryExemption()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) requestBatteryExemption()
        render()
    }

    private fun requestBatteryExemption() {
        val power = getSystemService(PowerManager::class.java)
        if (power.isIgnoringBatteryOptimizations(packageName)) return
        startActivity(
            Intent(
                Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                Uri.parse("package:$packageName")
            )
        )
    }

    private fun openSite() {
        val base = store.apiUrl?.removeSuffix(INGEST_PATH) ?: return
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$base/dashboard")))
    }

    private fun render() {
        when {
            !store.isConnected -> {
                status.text = "Not connected"
                detail.text = "Open BudgetFLOW in your phone's browser, go to Settings, and tap Connect this phone."
                primary.visibility = View.GONE
                appSettings.visibility = View.GONE
                disconnect.visibility = View.GONE
            }
            !hasSmsPermission() -> {
                status.text = "SMS access needed"
                detail.text = "Allow SMS access so bank messages can be logged.\n\n" +
                    "If Android says the setting is restricted, tap App settings, open the ⋮ menu, " +
                    "tap Allow restricted settings, then come back and try again."
                primary.text = "Allow SMS access"
                primary.setOnClickListener { ensurePermissions() }
                primary.visibility = View.VISIBLE
                appSettings.visibility = View.VISIBLE
                disconnect.visibility = View.VISIBLE
            }
            else -> {
                status.text = "Connected to ${Uri.parse(store.apiUrl).host}"
                detail.text = store.lastResult?.let { "Last message: $it" }
                    ?: "Every bank message is now logged automatically, even with this app closed."
                primary.text = "Open BudgetFLOW"
                primary.setOnClickListener { openSite() }
                primary.visibility = View.VISIBLE
                appSettings.visibility = View.GONE
                disconnect.visibility = View.VISIBLE
            }
        }
    }
}
