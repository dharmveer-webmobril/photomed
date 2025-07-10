import ScreenName from "./screenName";
import Login from "../screens/Auth/Login";
import SignUp from "../screens/Auth/SignUp";
import Welcome from "../screens/Auth/Welcome";
import ForgotPassword from "../screens/Auth/ForgotPassword";
import OtpVerification from "../screens/Auth/OtpVerification";
import UpdatePassword from "../screens/Auth/UpdatePassword";
import ConnectCloud from "../screens/Auth/ConnectCloud";
import Terms from "../screens/Profile/Terms";
import PrivacyPolicy from "../screens/Auth/PrivacyPolicy";


const _routes = [
    // {
    //     name: ScreenName.WELCOME_SCREEN,
    //     Component: Welcome,
    //     headerShown: false
    // },
    {
        name: ScreenName.LOGIN,
        Component: Login,
        headerShown: false
    },
    {
        name: ScreenName.SIGN_UP,
        Component: SignUp,
        headerShown: false
    },
    {
        name: ScreenName.FORGOT_PASSWORD,
        Component: ForgotPassword,
        headerShown: true
    },
    {
        name: ScreenName.OTP_VERIFICATION,
        Component: OtpVerification,
        headerShown: true
    },
    {
        name: ScreenName.TERMS,
        Component: Terms,
        headerShown: true
    },
    {
        name: 'Privacy Policy',
        Component: PrivacyPolicy,
        headerShown: true
    },
    {
        name: ScreenName.UPDATE_PASSWORD,
        Component: UpdatePassword,
        headerShown: true
    },
    {
        name: ScreenName.CONNECT_CLOUD,
        Component: ConnectCloud,
        headerShown: false
    },
]

export default _routes;
