import React, { useState, useEffect } from "react";
import {
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface StudentProfile {
  major: string;
  year: string;
  gpa: string;
  completedCourses: string;
  careerGoals: string;
  interests: string;
}

interface CourseRecommendation {
  code: string;
  name: string;
  credits: number;
  difficulty: number;
  difficultyReason: string;
  careerRelevance: number;
  careerReason: string;
  weeklyHours: number;
  prerequisitesMet: boolean;
  whyThisCourse: string;
}

interface Recommendations {
  recommendations: CourseRecommendation[];
  quarterSummary: string;
  gpaProjection: string;
  totalWorkload: number;
}

type Step = "welcome" | "profile" | "loading" | "results";

export default function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<StudentProfile>({
    major: "",
    year: "",
    gpa: "",
    completedCourses: "",
    careerGoals: "",
    interests: "",
  });
  const [recommendations, setRecommendations] =
    useState<Recommendations | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    try {
      const saved = localStorage.getItem("student-profile");
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (err) {
      console.log("No saved profile");
    }
  };

  const saveProfile = (newProfile: StudentProfile) => {
    try {
      localStorage.setItem("student-profile", JSON.stringify(newProfile));
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(profile);
    setStep("loading");
    setIsAnalyzing(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: `You are a UW course recommendation expert. Analyze courses for this student:

Profile:
- Major: ${profile.major}
- Year: ${profile.year}
- Current GPA: ${profile.gpa}
- Completed Courses: ${profile.completedCourses}
- Career Goals: ${profile.careerGoals}
- Interests: ${profile.interests}

Based on typical UW courses for this major, recommend 5-6 courses for next quarter. For EACH course provide:
1. Course code and name
2. Credits
3. Difficulty score (1-10) with reasoning
4. Career relevance score (1-10) with reasoning
5. Estimated weekly hours
6. Prerequisites status
7. Why this course fits the student

CRITICAL: Respond ONLY with valid JSON, no markdown, no preamble. Use this exact structure:
{
  "recommendations": [
    {
      "code": "CSE 143",
      "name": "Computer Programming II",
      "credits": 5,
      "difficulty": 7,
      "difficultyReason": "...",
      "careerRelevance": 9,
      "careerReason": "...",
      "weeklyHours": 12,
      "prerequisitesMet": true,
      "whyThisCourse": "..."
    }
  ],
  "quarterSummary": "Overall analysis of this quarter plan",
  "gpaProjection": "Projected GPA impact",
  "totalWorkload": 45
}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content.find((c: any) => c.type === "text")?.text || "";

      const cleanText = text.replace(/```json\n?|```\n?/g, "").trim();
      const parsed: Recommendations = JSON.parse(cleanText);

      setRecommendations(parsed);
      setStep("results");
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Failed to analyze courses. Please try again.");
      setStep("profile");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDifficultyColor = (score: number): string => {
    if (score <= 4) return "text-green-600 bg-green-50";
    if (score <= 7) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 8) return "text-purple-600 bg-purple-50";
    if (score >= 5) return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50";
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Course Crystal Ball
            </h1>
            <p className="text-xl text-gray-600">
              Your AI-powered UW course planning assistant
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Smart Recommendations
                </h3>
                <p className="text-gray-600 text-sm">
                  Get personalized course suggestions based on your academic
                  profile and career goals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Workload Balance
                </h3>
                <p className="text-gray-600 text-sm">
                  Avoid overloading yourself with accurate difficulty and time
                  estimates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <Star className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Career Alignment
                </h3>
                <p className="text-gray-600 text-sm">
                  See how each course connects to your future career path
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep("profile")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2 text-lg"
          >
            Get Started
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Build Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              Help us understand your academic journey
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major
                </label>
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) =>
                    setProfile({ ...profile, major: e.target.value })
                  }
                  placeholder="e.g., Computer Science, Biology, Business"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={profile.year}
                    onChange={(e) =>
                      setProfile({ ...profile, year: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current GPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={profile.gpa}
                    onChange={(e) =>
                      setProfile({ ...profile, gpa: e.target.value })
                    }
                    placeholder="3.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completed Courses
                </label>
                <textarea
                  value={profile.completedCourses}
                  onChange={(e) =>
                    setProfile({ ...profile, completedCourses: e.target.value })
                  }
                  placeholder="e.g., CSE 142, MATH 124, CHEM 142, ENGL 131..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Goals
                </label>
                <textarea
                  value={profile.careerGoals}
                  onChange={(e) =>
                    setProfile({ ...profile, careerGoals: e.target.value })
                  }
                  placeholder="e.g., Software engineer at tech company, medical school, data scientist..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Interests
                </label>
                <input
                  type="text"
                  value={profile.interests}
                  onChange={(e) =>
                    setProfile({ ...profile, interests: e.target.value })
                  }
                  placeholder="e.g., Machine learning, web development, algorithms"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                onClick={handleProfileSubmit}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                Analyze Courses
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Analyzing Your Options...
          </h2>
          <p className="text-purple-200 text-lg">
            Finding the perfect courses for you
          </p>
        </div>
      </div>
    );
  }

  if (step === "results" && recommendations) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Personalized Course Plan
            </h2>
            <p className="text-gray-600 mb-4">
              {recommendations.quarterSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">
                  Projected GPA Impact
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {recommendations.gpaProjection}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">
                  Total Weekly Hours
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {recommendations.totalWorkload}h
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">
                  Total Credits
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {recommendations.recommendations.reduce(
                    (sum, c) => sum + c.credits,
                    0
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations.recommendations.map((course, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {course.code}
                    </h3>
                    <p className="text-gray-600">{course.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {course.credits}
                    </div>
                    <div className="text-xs text-gray-500">credits</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div
                    className={`rounded-lg p-3 ${getDifficultyColor(
                      course.difficulty
                    )}`}
                  >
                    <div className="text-xs font-medium mb-1">Difficulty</div>
                    <div className="text-lg font-bold">
                      {course.difficulty}/10
                    </div>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${getRelevanceColor(
                      course.careerRelevance
                    )}`}
                  >
                    <div className="text-xs font-medium mb-1">Career Fit</div>
                    <div className="text-lg font-bold">
                      {course.careerRelevance}/10
                    </div>
                  </div>
                  <div className="rounded-lg p-3 bg-gray-50 text-gray-700">
                    <div className="text-xs font-medium mb-1">Weekly Time</div>
                    <div className="text-lg font-bold">
                      {course.weeklyHours}h
                    </div>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      course.prerequisitesMet
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">
                      Prerequisites
                    </div>
                    <div className="text-lg font-bold">
                      {course.prerequisitesMet ? "✓" : "✗"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">
                      Why this course:{" "}
                    </span>
                    <span className="text-gray-600">
                      {course.whyThisCourse}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Difficulty:{" "}
                    </span>
                    <span className="text-gray-600">
                      {course.difficultyReason}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Career relevance:{" "}
                    </span>
                    <span className="text-gray-600">{course.careerReason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep("profile")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
            >
              Adjust Profile
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Save Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
