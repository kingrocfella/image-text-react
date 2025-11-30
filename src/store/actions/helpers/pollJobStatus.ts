import { RootState } from "../../index";
import {
  ExtractPdfTextResponse,
  JobStatusResponse,
} from "../../types/pdfTypes";
import { API_CONFIG } from "../../../../config";
import { apiCallWithRefresh } from "../../../utils/apiClient";

const POLLING_INTERVAL = 10000; // 10 seconds

export const pollJobStatus = async (
  messageId: string,
  dispatch: any,
  getState: () => RootState,
  accessToken: string | null,
  tokenType: string | null
): Promise<ExtractPdfTextResponse> => {
  while (true) {
    const response = await apiCallWithRefresh(
      `${API_CONFIG.BASE_URL}/job/${messageId}`,
      {
        method: "GET",
      },
      dispatch,
      getState,
      accessToken,
      tokenType
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to check job status" }));
      throw new Error(
        errorData.message || errorData.detail || "Failed to check job status"
      );
    }

    const data: JobStatusResponse = await response.json();

    // Check if job is still pending
    if (data?.status === "pending") {
      // Wait for polling interval before checking again
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
      continue;
    }

    // Job is completed - response has content
    if (data?.content !== undefined) {
      return {
        content: data.content,
        description: data?.description || "",
        request_id: data?.request_id || "",
      };
    }

    // Unexpected response format
    throw new Error("Something went wrong");
  }
};
