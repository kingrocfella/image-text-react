import { ThunkAction } from "redux-thunk";
import { RootState } from "../index";
import { ImageActionTypes, ExtractTextResponse } from "../types/imageTypes";
import { API_CONFIG } from "../../../config";
import { apiCallWithRefresh } from "../../utils/apiClient";

// Action Creators
export const extractTextRequest = (): ImageActionTypes => ({
  type: "EXTRACT_TEXT_REQUEST",
});
export const extractTextSuccess = (text: string): ImageActionTypes => ({
  type: "EXTRACT_TEXT_SUCCESS",
  payload: text,
});
export const extractTextFailure = (error: string): ImageActionTypes => ({
  type: "EXTRACT_TEXT_FAILURE",
  payload: error,
});
export const clearExtractedText = (): ImageActionTypes => ({
  type: "CLEAR_EXTRACTED_TEXT",
});

// Thunk Action
export const extractText = (
  imageUri: string,
  accessToken: string | null,
  tokenType: string | null
): ThunkAction<Promise<void>, RootState, unknown, ImageActionTypes> => {
  return async (dispatch, getState) => {
    dispatch(extractTextRequest());

    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      const response = await apiCallWithRefresh(
        `${API_CONFIG.BASE_URL}/convert/image/text`,
        {
          method: "POST",
          body: formData,
        },
        dispatch,
        getState,
        accessToken,
        tokenType
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Text extraction failed" }));
        throw new Error(
          errorData.message || errorData.detail || "Text extraction failed"
        );
      }

      const data: ExtractTextResponse = await response.json();

      const extractedText: string = data?.message;

      dispatch(extractTextSuccess(extractedText));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(extractTextFailure(errorMessage));
      throw error;
    }
  };
};
