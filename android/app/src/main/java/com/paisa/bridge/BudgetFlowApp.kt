package com.paisa.bridge

import android.app.Application

class BudgetFlowApp : Application() {
    override fun onCreate() {
        super.onCreate()
        CrashLog.install(this)
    }
}
