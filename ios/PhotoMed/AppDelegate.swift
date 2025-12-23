import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import RNBootSplash

@main
class AppDelegate: UIResponder, UIApplicationDelegate, RNAppAuthAuthorizationFlowManager {

    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    // Required by RNAppAuth
    public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {

        // React Native setup
        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        // Create main window
        window = UIWindow(frame: UIScreen.main.bounds)

        // Start RN bridge/root view
        factory.startReactNative(
            withModuleName: "PhotoMed",
            in: window,
            launchOptions: launchOptions
        )

        // Firebase initialization
        FirebaseApp.configure()

        return true
    }

    // MARK: - OAuth Redirect Handler
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {

        // RNAppAuth Native Handler
        if let delegate = authorizationFlowManagerDelegate,
           delegate.resumeExternalUserAgentFlow(with: url) {
            return true
        }

        return false
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {

        // Universal-link OAuth redirects
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let delegate = authorizationFlowManagerDelegate,
           delegate.resumeExternalUserAgentFlow(with: userActivity.webpageURL) {
            return true
        }

        // Fallback to RN Linking
        return RCTLinkingManager.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
}

// MARK: - React Native Delegate (bundle + BootSplash)
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

    override func sourceURL(for bridge: RCTBridge) -> URL? {
        return bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }

    override func customize(_ rootView: RCTRootView) {
        super.customize(rootView)

        // Initialize RNBootSplash using storyboard
        RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
    }
}
