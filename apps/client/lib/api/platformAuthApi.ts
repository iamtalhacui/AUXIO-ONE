import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  PlatformLoginResponse,
  PlatformOrganisation,
  PlatformUser,
  RegisterOrganisationRequest,
  RegisterOrganisationResponse,
} from "@/lib/api/types";
import { logoutPlatform } from "@/lib/store/platformAuthSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000",
  prepareHeaders: (headers, { getState }) => {
    const token = (
      getState() as { platformAuth: { accessToken: string | null } }
    ).platformAuth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logoutPlatform());
  }
  return result;
};

export const platformAuthApi = createApi({
  reducerPath: "platformAuthApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Organisations"],
  endpoints: (builder) => ({
    platformLogin: builder.mutation<
      PlatformLoginResponse,
      { email: string; password: string }
    >({
      query: (body) => ({
        url: "/platform/auth/login",
        method: "POST",
        body,
      }),
    }),
    platformMe: builder.query<PlatformUser, void>({
      query: () => "/platform/auth/me",
    }),
    listOrganisations: builder.query<PlatformOrganisation[], void>({
      query: () => "/platform/organisations",
      providesTags: ["Organisations"],
    }),
    registerOrganisation: builder.mutation<
      RegisterOrganisationResponse,
      RegisterOrganisationRequest
    >({
      query: (body) => ({
        url: "/platform/organisations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Organisations"],
    }),
  }),
});

export const {
  usePlatformLoginMutation,
  usePlatformMeQuery,
  useListOrganisationsQuery,
  useRegisterOrganisationMutation,
} = platformAuthApi;
