import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  OrgLoginResponse,
  OrgMeResponse,
  SetupAccountRequest,
  SetupAccountResponse,
} from "@/lib/api/types";
import { logoutOrg } from "@/lib/store/orgAuthSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000",
  prepareHeaders: (headers, { getState }) => {
    const token = (
      getState() as { orgAuth: { accessToken: string | null } }
    ).orgAuth.accessToken;
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
    api.dispatch(logoutOrg());
  }
  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    setupAccount: builder.mutation<SetupAccountResponse, SetupAccountRequest>({
      query: (body) => ({
        url: "/auth/setup",
        method: "POST",
        body,
      }),
    }),
    orgLogin: builder.mutation<OrgLoginResponse, { email: string; password: string }>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    orgMe: builder.query<OrgMeResponse, void>({
      query: () => "/auth/me",
    }),
  }),
});

export const { useSetupAccountMutation, useOrgLoginMutation, useOrgMeQuery } = authApi;
