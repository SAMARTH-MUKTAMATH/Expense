plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val siteUrl = "https://budgetfloww.vercel.app"

android {
    namespace = "com.paisa.bridge"
    compileSdk = 36
    buildToolsVersion = "35.0.0"

    defaultConfig {
        applicationId = "com.paisa.bridge"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "1.2"
        buildConfigField("String", "SITE_URL", "\"$siteUrl\"")
        manifestPlaceholders["siteUrl"] = siteUrl
        resValue(
            "string",
            "asset_statements",
            "[{\\\"relation\\\": [\\\"delegate_permission/common.handle_all_urls\\\"], " +
                "\\\"target\\\": {\\\"namespace\\\": \\\"web\\\", \\\"site\\\": \\\"$siteUrl\\\"}}]"
        )
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.work:work-runtime:2.9.1")
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.3")
}
