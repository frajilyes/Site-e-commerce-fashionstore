import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadApi } from "../../Api/lazy";
import { normalizeUser } from "../../utils/normalize";
import {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  clearSession,
} from "../../utils/storage";


const authError = (error) => ({
  message: error.message,
  code: error.data?.code ?? null,
});

const persistSession = ({ token, user }) => {
  const safeUser = normalizeUser(user);
  if (token) setToken(token);
  setStoredUser(safeUser);
  return safeUser;
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, thunkAPI) => {
    try {
      const { authApi } = await loadApi();
      const response = await authApi.register(userData);
      return { email: userData.email, message: response.message };
    } catch (error) {
      return thunkAPI.rejectWithValue(authError(error));
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (token, thunkAPI) => {
    try {
      const { authApi } = await loadApi();
      const response = await authApi.verifyEmail(token);
      return persistSession(response);
    } catch (error) {
      return thunkAPI.rejectWithValue(authError(error));
    }
  },
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (email, thunkAPI) => {
    try {
      const { authApi } = await loadApi();
      const response = await authApi.resendVerification(email);
      return { email, message: response.message };
    } catch (error) {
      return thunkAPI.rejectWithValue(authError(error));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const { authApi } = await loadApi();
      const response = await authApi.login(credentials);
      return persistSession(response);
    } catch (error) {
      return thunkAPI.rejectWithValue(authError(error));
    }
  },
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (credential, thunkAPI) => {
    try {
      const { authApi } = await loadApi();
      const response = await authApi.googleAuth(credential);
      return persistSession(response);
    } catch (error) {
      return thunkAPI.rejectWithValue(authError(error));
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, thunkAPI) => {
    if (!getToken()) {
      return thunkAPI.rejectWithValue("No token");
    }
    try {
      const { authApi } = await loadApi();
      const user = await authApi.me();
      const safeUser = normalizeUser(user);
      setStoredUser(safeUser);
      return safeUser;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, thunkAPI) => {
    try {
      const { usersApi } = await loadApi();
      const user = await usersApi.updateProfile(payload);
      const safeUser = normalizeUser(user);
      setStoredUser(safeUser);
      return safeUser;
    } catch (error) {
      return thunkAPI.rejectWithValue(authError(error));
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (payload, thunkAPI) => {
    try {
      const { usersApi } = await loadApi();
      const result = await usersApi.changePassword(payload);
      if (result?.token) setToken(result.token);
      return result;
    } catch (error) {
      return thunkAPI.rejectWithValue(authError(error));
    }
  },
);

const storedUser = getStoredUser();
const storedToken = getToken();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser,
    token: storedToken,
    isAuthenticated: Boolean(storedToken && storedUser),
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMessage: null,
    errorCode: null,
    pendingVerificationEmail: null,
    verificationMessage: null,
    redirectTo: null,
    isSessionChecked: false,
  },
  reducers: {
    resetAuthState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = null;
      state.errorCode = null;
    },
    clearPendingVerification: (state) => {
      state.pendingVerificationEmail = null;
      state.verificationMessage = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = null;
      state.errorCode = null;
      clearSession();
    },
    setRedirectTo: (state, action) => {
      state.redirectTo = action.payload;
    },
    clearRedirectTo: (state) => {
      state.redirectTo = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.isLoading = true;
      state.isError = false;
      state.errorMessage = null;
      state.errorCode = null;
    };

    const fulfilled = (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.token = getToken();
    };

    const rejected = (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.errorMessage = action.payload?.message || "Authentication failed";
      state.errorCode = action.payload?.code ?? null;
    };

    builder
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.pendingVerificationEmail = action.payload.email;
        state.verificationMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, rejected)

      .addCase(verifyEmail.pending, pending)
      .addCase(verifyEmail.fulfilled, (state, action) => {
        fulfilled(state, action);
        state.pendingVerificationEmail = null;
        state.verificationMessage = null;
      })
      .addCase(verifyEmail.rejected, rejected)

      .addCase(resendVerification.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
        state.errorCode = null;
      })
      .addCase(resendVerification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingVerificationEmail = action.payload.email;
        state.verificationMessage = action.payload.message;
      })
      .addCase(resendVerification.rejected, rejected)

      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, fulfilled)
      .addCase(loginUser.rejected, rejected)

      .addCase(googleLogin.pending, pending)
      .addCase(googleLogin.fulfilled, fulfilled)
      .addCase(googleLogin.rejected, rejected)

      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = getToken();
        state.isSessionChecked = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isSessionChecked = true;
        clearSession();
      })

      .addCase(updateProfile.pending, pending)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, rejected)

      .addCase(changePassword.pending, pending)
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(changePassword.rejected, rejected);
  },
});

export const {
  resetAuthState,
  clearPendingVerification,
  logout,
  setRedirectTo,
  clearRedirectTo,
} = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";
export const selectPendingVerificationEmail = (state) =>
  state.auth.pendingVerificationEmail;

export default authSlice.reducer;
