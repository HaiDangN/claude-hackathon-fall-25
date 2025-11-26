import React, { useState, ChangeEvent } from "react";
import {
  Calendar,
  Upload,
  Download,
  Camera,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

interface APIResponse {
  content: Array<{
    type: string;
    text?: string;
  }>;
}

export default function CalendarPhotoConverter() {
  const [image, setImage] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setEvents([]);

    const reader = new FileReader();
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result as string;
      const base64Data = result.split(",")[1];
      setImage(result);
      await processImage(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Data: string): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this calendar image and extract all events. For each event, identify:
- Event title/name
- Start date and time
- End date and time (if available, otherwise assume 1 hour duration)
- Location (if mentioned)
- Description (if any)

Return ONLY a JSON array with no preamble or markdown formatting. Each event should have this structure:
[
  {
    "title": "Event Name",
    "start": "YYYY-MM-DDTHH:MM:SS",
    "end": "YYYY-MM-DDTHH:MM:SS",
    "location": "Location (optional)",
    "description": "Description (optional)"
  }
]

If you cannot parse any events, return an empty array: []`,
                },
              ],
            },
          ],
        }),
      });

      const data: APIResponse = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error("No response from API");
      }

      const textContent = data.content
        .filter((item) => item.type === "text")
        .map((item) => item.text || "")
        .join("");

      const cleanedText = textContent.replace(/```json|```/g, "").trim();
      const parsedEvents: CalendarEvent[] = JSON.parse(cleanedText);

      if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
        setEvents(parsedEvents);
      } else {
        setError("No events found in the image. Please try a clearer photo.");
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setError(
        "Failed to process the image. Please ensure it contains a visible calendar and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateToICS = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const generateICS = (): string => {
    let icsContent =
      "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Calendar Photo Converter//EN\n";

    events.forEach((event, index) => {
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${Date.now()}-${index}@calendar-converter\n`;
      icsContent += `DTSTAMP:${formatDateToICS(new Date().toISOString())}\n`;
      icsContent += `DTSTART:${formatDateToICS(event.start)}\n`;
      icsContent += `DTEND:${formatDateToICS(event.end)}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      if (event.location) {
        icsContent += `LOCATION:${event.location}\n`;
      }
      if (event.description) {
        icsContent += `DESCRIPTION:${event.description}\n`;
      }
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";
    return icsContent;
  };

  const downloadICS = (): void => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar-events.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Calendar Photo to ICS</h1>
                <p className="text-blue-100 text-sm mt-1">
                  Convert calendar photos to importable events
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Upload Section */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Upload Calendar Photo
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  Click to upload or drag a photo of your calendar
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Supports JPG, PNG, HEIC
                </p>
              </div>
            </div>

            {/* Preview Image */}
            {image && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Preview
                </h3>
                <img
                  src={image}
                  alt="Calendar preview"
                  className="max-h-64 mx-auto rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-gray-600">Extracting events from image...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Events List */}
            {events.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Found {events.length} Event{events.length !== 1 ? "s" : ""}
                  </h3>
                  <button
                    onClick={downloadICS}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download ICS
                  </button>
                </div>

                <div className="space-y-3">
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {event.title}
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Start:</span>{" "}
                          {new Date(event.start).toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">End:</span>{" "}
                          {new Date(event.end).toLocaleString()}
                        </p>
                        {event.location && (
                          <p>
                            <span className="font-medium">Location:</span>{" "}
                            {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p>
                            <span className="font-medium">Description:</span>{" "}
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {events.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  How to Import to Google Calendar:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click "Download ICS" to save the calendar file</li>
                  <li>Open Google Calendar on your computer</li>
                  <li>Click the gear icon → Settings</li>
                  <li>Click "Import & Export" in the left sidebar</li>
                  <li>
                    Click "Select file from your computer" and choose the
                    downloaded .ics file
                  </li>
                  <li>
                    Choose which calendar to add the events to and click
                    "Import"
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
