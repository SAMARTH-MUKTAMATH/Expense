package com.paisa.bridge

import android.net.Uri
import com.google.androidbrowserhelper.trusted.LauncherActivity

class AppLauncherActivity : LauncherActivity() {
    override fun getLaunchingUrl(): Uri = Site.inAppUri(super.getLaunchingUrl(), isTrackingOn())
}
