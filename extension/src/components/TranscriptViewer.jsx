import React, { useMemo } from "react";
import ErrorBoundary from "./ErrorBoundary";
import EmptyState from "./EmptyState";
import { normalizeArrayData } from "../utils/normalizeArrayData";
import { useAIFetch } from "../hooks/useAIFetch";

/**
 * Example component demonstrating safe rendering of Transcript data.
 */
export default function TranscriptViewer() {
    // Note: Ensure the URL matches a valid backend endpoint for this example.
    const { data, isLoading, error } = useAIFetch({
        url: "http://localhost:5000/get_transcript", // Just a demo URL
        fetchOptions: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_url: "example" }),
        },
        timeout: 45000, // 45s timeout for transcript
    });

    // Safely extract text lines or segments
    const transcriptSegments = useMemo(() => normalizeArrayData(data?.segments), [data]);

    let content;

    if (isLoading) {
        content = (
            <div className="flex justify-center p-8">
                <div className="loader border-[#00CBE7] border-4 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
            </div>
        );
    } else if (error === "TIMEOUT") {
        content = <EmptyState message="Transcript generation timed out. The video might be too long." />;
    } else if (error === "NETWORK") {
        content = <EmptyState message="Network error while fetching the transcript." />;
    } else if (transcriptSegments.length === 0) {
        content = <EmptyState message="No transcript segments found." />;
    } else {
        content = (
            <div className="space-y-2 max-h-64 overflow-y-auto px-2">
                {transcriptSegments.map((segment, index) => (
                    <div key={index} className="p-2 border border-[#3E5063] rounded-md text-white text-sm">
                       {segment.text}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <ErrorBoundary fallback={<EmptyState message="Transcript failed to render" />}>
            {content}
        </ErrorBoundary>
    );
}
