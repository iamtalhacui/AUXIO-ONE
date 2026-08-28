import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CreateOrganisationRequest,
  CreateOrganisationResponse,
  LoginRequest,
  LoginResponse,
} from "@/lib/api/types";
import type { RootState } from "@/lib/store/store";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Organisation"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),
    createOrganisation: builder.mutation<
      CreateOrganisationResponse,
      CreateOrganisationRequest
    >({
      query: (body) => ({
        url: "/organisations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Organisation"],
    }),
  }),
});

export const {
  useLoginMutation,
  useChangePasswordMutation,
  useCreateOrganisationMutation,
} = api;
