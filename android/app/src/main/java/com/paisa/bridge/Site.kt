package com.paisa.bridge

object Site {
    val ingestUrl = "${BuildConfig.SITE_URL}/api/ingest/sms"
    val dashboardUrl = "${BuildConfig.SITE_URL}/dashboard"
    fun connectUrl(state: String) = "${BuildConfig.SITE_URL}/api/connect-phone?state=$state"
}
