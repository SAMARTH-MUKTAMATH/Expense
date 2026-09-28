package com.paisa.bridge

import android.net.Uri

object Site {
    val ingestUrl = "${BuildConfig.SITE_URL}/api/ingest/sms"

    fun connectUri(state: String): Uri =
        Uri.parse("${BuildConfig.SITE_URL}/api/connect-phone?state=$state")

    fun dashboardUri(trackingOn: Boolean): Uri =
        inAppUri(Uri.parse("${BuildConfig.SITE_URL}/dashboard"), trackingOn)

    fun inAppUri(base: Uri, trackingOn: Boolean): Uri = base.buildUpon()
        .appendQueryParameter("source", "twa")
        .appendQueryParameter("tracking", if (trackingOn) "on" else "off")
        .build()
}
