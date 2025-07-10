import { commonApi } from './common';

export const userApi = commonApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userRegistrationData) => ({
        url: 'register',
        method: 'POST',
        body: userRegistrationData,
      }),
    }),
    login: builder.mutation({
      query: (loginData) => ({
        url: 'login',
        method: 'POST',
        body: loginData,
      }),
    }),
    requestCode: builder.mutation({
      query: (requestOtpData) => ({
        url: 'sendotp',
        method: 'POST',
        body: requestOtpData,
      }),
    }),
    verifyEmail: builder.mutation({
      query: ({ token, ...verifyOtpData }) => ({
        url: 'verifyotp',
        method: 'POST',
        body: verifyOtpData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
    currentUserProfile: builder.query({
      query: ({ token }) => ({
        url: 'getprofile',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
      // Provide a tag to identify this query's data.
      providesTags: ['UserProfile'],
    }),
    updateProfile: builder.mutation({
      query: ({ token, full_name, mobile, profile }) => {
        // console.log('Received Parameters:', { full_name, mobile, profile });
        const formData = new FormData();
        formData.append('full_name', full_name);
        formData.append('mobile', mobile);

        if (profile) {
          formData.append('profile', {
            uri: profile,
            type: 'image/jpeg',
            name: profile.split('/').pop(),
          });
        }

        // console.log('FormData after appending:', formData._parts);

        return {
          url: 'updateprofile',
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      },
      // Invalidate the `UserProfile` tag to trigger re-fetching the profile data.
      invalidatesTags: ['UserProfile'],
    }),
    deleteAccount: builder.mutation({
      query: ({ token, id }) => ({
        url: 'deleteaccount',
        method: 'POST',
        body: { id },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
    resetPasswordOTPCode: builder.mutation({
      query: ({ token, ...resetPasswordOTPData }) => ({
        url: 'resetpassword',
        method: 'POST',
        body: resetPasswordOTPData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
    changePassword: builder.mutation({
      query: ({token,...changePasswordData}) => ({
        url: 'changepassword',
        method: 'POST',
        body: changePasswordData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRequestCodeMutation,
  useVerifyEmailMutation,
  useCurrentUserProfileQuery,
  useLazyCurrentUserProfileQuery,
  useUpdateProfileMutation,
  useResetPasswordOTPCodeMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,  // Add the custom hook for deleteAccount
} = userApi;
