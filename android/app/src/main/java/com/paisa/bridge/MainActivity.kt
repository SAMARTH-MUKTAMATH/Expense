package com.paisa.bridge

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
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
import java.security.SecureRandom

private const val SMS_PERMISSION_REQUEST = 1
private const val BRAND = "#89E900"
private const val INK = "#0A0A0A"
private const val MUTED = "#A0A0A0"

private const val RESTRICTED_HELP =
    "If Android says the setting is restricted, tap App settings, open the ⋮ menu, " +
        "tap Allow restricted settings, then come back and try again."

private fun Button.show(label: String, onClick: () -> Unit) {
    text = label
    setOnClickListener { onClick() }
    visibility = View.VISIBLE
}

private fun Button.hide() {
    visibility = View.GONE
}

class MainActivity : Activity() {
    private lateinit var store: TokenStore
    private lateinit var heading: TextView
    private lateinit var detail: TextView
    private lateinit var primary: Button
    private lateinit var secondary: Button

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
            setBackgroundColor(Color.parseColor(INK))
            setPadding(dp(24), dp(72), dp(24), dp(24))
        }

        val brand = TextView(this).apply {
            text = getString(R.string.app_name)
            setTextColor(Color.parseColor(BRAND))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            typeface = Typeface.DEFAULT_BOLD
        }
        heading = TextView(this).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
            typeface = Typeface.DEFAULT_BOLD
        }
        detail = TextView(this).apply {
            setTextColor(Color.parseColor(MUTED))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setLineSpacing(0f, 1.2f)
        }
        primary = Button(this).apply {
            backgroundTintList = ColorStateList.valueOf(Color.parseColor(BRAND))
            setTextColor(Color.parseColor(INK))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            isAllCaps = false
            minHeight = dp(56)
        }
        secondary = Button(this).apply {
            isAllCaps = false
            minHeight = dp(52)
        }

        root.addView(brand, row(dp(32)))
        root.addView(heading, row(dp(12)))
        root.addView(detail, row(dp(32)))
        root.addView(primary, row(dp(8)))
        root.addView(secondary, row(0))
        return root
    }

    private fun row(bottomMargin: Int) = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
    ).apply { this.bottomMargin = bottomMargin }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun render() {
        when {
            store.isConnected && hasSmsPermission() -> showTracking()
            store.isConnected -> showSmsAccessNeeded("SMS access is off")
            else -> showStart()
        }
    }

    private fun showStart() {
        heading.text = "Track expenses automatically"
        detail.text = "Every payment and credit your bank texts you is added to BudgetFLOW on its own, " +
            "even when this app is closed."
        primary.show("Start auto tracking") { onStartTracking() }
        secondary.hide()
    }

    private fun showTracking() {
        heading.text = "Auto tracking is on"
        detail.text = store.lastResult?.let { "Last bank message: $it" }
            ?: "Waiting for your next bank SMS. You can close this app now."
        primary.show("Open BudgetFLOW") { openUrl(Site.dashboardUrl) }
        secondary.show("Stop auto tracking") {
            store.clear()
            render()
        }
    }

    private fun showSmsAccessNeeded(title: String) {
        heading.text = title
        detail.text = "BudgetFLOW needs SMS access to add your bank payments.\n\n$RESTRICTED_HELP"
        primary.show("Allow SMS access") { requestSmsPermission() }
        secondary.show("App settings") {
            startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
            )
        }
    }

    private fun showFinishInBrowser() {
        heading.text = "Finish in your browser"
        detail.text = "Sign in to BudgetFLOW if it asks. You will come straight back here."
        primary.show("Open browser again") { signIn() }
        secondary.hide()
    }

    private fun onStartTracking() {
        if (hasSmsPermission()) signIn() else showDisclosure()
    }

    private fun showDisclosure() {
        AlertDialog.Builder(this)
            .setTitle("Allow BudgetFLOW to read bank SMS?")
            .setMessage(
                "BudgetFLOW reads SMS from your bank to add payments automatically.\n\n" +
                    "Only bank messages are sent to your BudgetFLOW account. " +
                    "Messages from people are ignored and never leave your phone."
            )
            .setPositiveButton("Continue") { _, _ -> requestSmsPermission() }
            .setNegativeButton("Not now", null)
            .show()
    }

    private fun hasSmsPermission() =
        checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED

    private fun requestSmsPermission() {
        if (hasSmsPermission()) {
            afterSmsGranted()
            return
        }
        requestPermissions(arrayOf(Manifest.permission.RECEIVE_SMS), SMS_PERMISSION_REQUEST)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != SMS_PERMISSION_REQUEST) return
        if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
            afterSmsGranted()
        } else {
            showSmsAccessNeeded("SMS access needed")
        }
    }

    private fun afterSmsGranted() {
        if (store.isConnected) render() else signIn()
    }

    private fun signIn() {
        val state = newState()
        store.pendingState = state
        showFinishInBrowser()
        openUrl(Site.connectUrl(state))
    }

    private fun handleConnectLink(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "paisa" || data.host != "connect") return
        val token = data.getQueryParameter("token")
        val state = data.getQueryParameter("state")
        val expected = store.pendingState
        if (token.isNullOrBlank() || expected == null || state != expected) return
        store.token = token
        store.pendingState = null
        store.lastResult = null
        requestBatteryExemption()
        render()
    }

    private fun requestBatteryExemption() {
        val power = getSystemService(PowerManager::class.java)
        if (power.isIgnoringBatteryOptimizations(packageName)) return
        startActivity(
            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))
        )
    }

    private fun openUrl(url: String) {
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }

    private fun newState(): String {
        val bytes = ByteArray(24)
        SecureRandom().nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
