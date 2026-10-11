package com.paisa.bridge

import android.net.Uri
import android.os.Bundle
import com.google.androidbrowserhelper.trusted.LauncherActivity

class AppLauncherActivity : LauncherActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (isTrackingOn()) scheduleInboxSync(this)
    }

    override fun getLaunchingUrl(): Uri = Site.inAppUri(super.getLaunchingUrl(), isTrackingOn())
}
