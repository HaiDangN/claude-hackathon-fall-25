import React, { useState } from 'react';
import { Upload, Calendar, Download, AlertCircle } from 'lucide-react';

export default function PhotoToICSGenerator() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [icsData, setIcsData] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please drop an image file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select an image file');
      }
    }
  };

  const generateICS = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    if (!process.env.REACT_APP_ANTHROPIC_API_KEY) {
      setError('API key not configured. Please set REACT_APP_ANTHROPIC_API_KEY environment variable.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target.result.split(',')[1];
        const mediaType = file.type;

        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 2000,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image',
                      source: {
                        type: 'base64',
                        media_type: mediaType,
                        data: base64Image,
                      },
                    },
                    {
                      type: 'text',
                      text: `Analyze this image and extract any calendar events, appointments, schedules, or important dates shown. For each event found, generate an ICS (iCalendar) format entry. Include realistic times and durations based on context clues. Return ONLY valid ICS format content that can be imported directly into a calendar application. Start with BEGIN:VCALENDAR and end with END:VCALENDAR. If no events are found, create a sample ICS with one generic event based on the image content.`,
                    },
                  ],
                },
              ],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
          }

          const data = await response.json();
          const icsContent = data.content[0].text;

          setIcsData(icsContent);
          setSuccess('ICS generated successfully!');
        } catch (apiError) {
          setError(`API Error: ${apiError.message}`);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const downloadICS = () => {
    const element = document.createElement('a');
    const file = new Blob([icsData], { type: 'text/calendar' });
    element.href = URL.createObjectURL(file);
    element.download = 'calendar.ics';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <Calendar className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Photo to Calendar</h1>
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Drag and drop your image here</p>
            <p className="text-gray-500 text-sm mb-4">or</p>
            <label className="inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="bg-indigo-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors inline-block">
                Select Image
              </span>
            </label>
          </div>

          {/* File Info */}
          {file && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Selected:</span> {file.name}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateICS}
            disabled={!file || loading}
            className="w-full mt-8 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating ICS...' : 'Generate ICS Calendar'}
          </button>

          {/* ICS Preview and Download */}
          {icsData && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Generated ICS</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm text-gray-700 mb-4 border border-gray-200">
                <pre>{icsData}</pre>
              </div>
              <button
                onClick={downloadICS}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download ICS File
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-semibold mb-2">How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Drag and drop or select an image containing calendar events</li>
              <li>Click "Generate ICS Calendar" to analyze the image</li>
              <li>Review the generated calendar data</li>
              <li>Download the ICS file to import into your calendar app</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}