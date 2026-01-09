import { useState, useMemo } from "react";
import { Card, Space, Tag, Tooltip, Button, Alert, Progress, theme } from "antd";
import {
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Eye,
} from "lucide-react";

const { useToken } = theme;

interface ContentStatsProps {
  content: string;
}

interface ContentAnalysis {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  linkCount: number;
  imageCount: number;
  headingCount: number;
  listCount: number;
  readingTimeMinutes: number;
  readabilityScore: number;
  issues: ContentIssue[];
}

interface ContentIssue {
  type: "warning" | "error" | "info";
  message: string;
}

const ContentStats = ({ content }: ContentStatsProps) => {
  const { token } = useToken();
  const [showDetails, setShowDetails] = useState(true); // Default to show, but compact view

  // Analyze content
  const analysis = useMemo((): ContentAnalysis => {
    // Strip HTML tags for text analysis
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // Count words
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const wordCount = words.length;

    // Count characters
    const characterCount = textContent.length;
    const characterCountNoSpaces = textContent.replace(/\s/g, "").length;

    // Count HTML elements
    const linkCount = (content.match(/<a\s/gi) || []).length;
    const imageCount = (content.match(/<img\s/gi) || []).length;
    const headingCount = (content.match(/<h[1-6]/gi) || []).length;
    const listCount = (content.match(/<[ou]l>/gi) || []).length;

    // Calculate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // Simple readability score (based on average word length and sentence structure)
    const averageWordLength = characterCountNoSpaces / Math.max(wordCount, 1);
    const sentences = textContent
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const averageSentenceLength = wordCount / Math.max(sentences.length, 1);

    // Flesch Reading Ease approximation (simplified)
    // Score: 0-100, higher is easier to read
    const readabilityScore = Math.max(
      0,
      Math.min(
        100,
        206.835 - 1.015 * averageSentenceLength - 84.6 * (averageWordLength / 5)
      )
    );

    // Detect content issues
    const issues: ContentIssue[] = [];

    // Check for very short content
    if (wordCount < 50) {
      issues.push({
        type: "warning",
        message:
          "Content is very short. Consider adding more detail for better engagement.",
      });
    }

    // Check for very long content
    if (wordCount > 500) {
      issues.push({
        type: "info",
        message:
          "Long content detected. Ensure key points are highlighted early.",
      });
    }

    // Check for all caps text (common spam indicator)
    const allCapsMatches = textContent.match(/\b[A-Z]{5,}\b/g);
    if (allCapsMatches && allCapsMatches.length > 3) {
      issues.push({
        type: "warning",
        message:
          "Multiple ALL CAPS words detected. Consider using normal case for better readability.",
      });
    }

    // Check for excessive punctuation
    const excessivePunctuation = textContent.match(/[!?]{2,}/g);
    if (excessivePunctuation && excessivePunctuation.length > 0) {
      issues.push({
        type: "warning",
        message:
          "Excessive punctuation detected (!!, ??). Use sparingly for professional tone.",
      });
    }

    // Check for no images
    if (imageCount === 0 && wordCount > 100) {
      issues.push({
        type: "info",
        message:
          "No images found. Visual content can increase conversion rates by 80%+.",
      });
    }

    // Check for no headings
    if (headingCount === 0 && wordCount > 100) {
      issues.push({
        type: "info",
        message: "No headings found. Headings improve scannability and SEO.",
      });
    }

    // Check readability
    if (readabilityScore < 50) {
      issues.push({
        type: "warning",
        message:
          "Content may be difficult to read. Consider shorter sentences and simpler words.",
      });
    }

    // Check for missing links
    if (linkCount === 0 && wordCount > 150) {
      issues.push({
        type: "info",
        message:
          "No links found. Consider adding relevant links for more information.",
      });
    }

    return {
      wordCount,
      characterCount,
      characterCountNoSpaces,
      linkCount,
      imageCount,
      headingCount,
      listCount,
      readingTimeMinutes,
      readabilityScore,
      issues,
    };
  }, [content]);

  // Get readability label
  const getReadabilityLabel = (
    score: number
  ): { label: string; color: string } => {
    if (score >= 80) return { label: "Very Easy", color: "success" };
    if (score >= 60) return { label: "Easy", color: "success" };
    if (score >= 50) return { label: "Moderate", color: "warning" };
    if (score >= 30) return { label: "Difficult", color: "error" };
    return { label: "Very Difficult", color: "error" };
  };

  const readabilityInfo = getReadabilityLabel(analysis.readabilityScore);

  // Get word count status
  const getWordCountStatus = (
    count: number
  ): { status: "success" | "warning" | "error"; color: string } => {
    if (count < 50) return { status: "error", color: "#ff4d4f" };
    if (count < 100) return { status: "warning", color: "#faad14" };
    if (count > 500) return { status: "warning", color: "#faad14" };
    return { status: "success", color: "#52c41a" };
  };

  const wordCountStatus = getWordCountStatus(analysis.wordCount);

  return (
    <Card
      size="small"
      title={
        <Space size="small">
          <TrendingUp size={16} />
          <span style={{ fontSize: 14 }}>Content Performance</span>
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={<Eye size={12} />}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide" : "Show"}
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      {/* Main Stats */}
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {/* Primary Metrics Row - Compact */}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Tooltip title="Number of words in your description">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={14} color={wordCountStatus.color} />
              <div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1 }}>
                  Words
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: wordCountStatus.color,
                    lineHeight: 1.2,
                  }}
                >
                  {analysis.wordCount}
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Estimated reading time for customers">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Eye size={14} />
              <div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1 }}>
                  Read Time
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>
                  {analysis.readingTimeMinutes} min
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Readability score (0-100, higher is easier)">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle
                size={14}
                color={
                  readabilityInfo.color === "success"
                    ? "#52c41a"
                    : readabilityInfo.color === "warning"
                    ? "#faad14"
                    : "#ff4d4f"
                }
              />
              <div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1 }}>
                  Readability
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>
                  {Math.round(analysis.readabilityScore)}
                  <span style={{ fontSize: 12, color: "#999", marginLeft: 2 }}>
                    /100
                  </span>
                </div>
              </div>
            </div>
          </Tooltip>

          <Tag color={readabilityInfo.color} style={{ margin: 0 }}>
            {readabilityInfo.label}
          </Tag>
        </div>

        {/* Content Elements */}
        {showDetails && (
          <>
            {/* Readability Progress Bar */}
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 500 }}>
                  Content Quality
                </span>
                <span style={{ fontSize: 11, color: "#666" }}>
                  {analysis.issues.length === 0
                    ? "Excellent"
                    : `${analysis.issues.length} suggestion${
                        analysis.issues.length > 1 ? "s" : ""
                      }`}
                </span>
              </div>
              <Progress
                percent={Math.round(analysis.readabilityScore)}
                strokeColor={{
                  "0%": analysis.readabilityScore > 60 ? "#52c41a" : "#ff4d4f",
                  "100%":
                    analysis.readabilityScore > 60 ? "#73d13d" : "#ff7875",
                }}
                showInfo={false}
                size="small"
              />
            </div>

            {/* Content Elements Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: 12,
                padding: 12,
                background: token.colorBgTextHover,
                borderRadius: 6,
              }}
            >
              <Tooltip title="Number of clickable links">
                <div style={{ textAlign: "center" }}>
                  <LinkIcon
                    size={20}
                    color={token.colorPrimary}
                    style={{ marginBottom: 4 }}
                  />
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {analysis.linkCount}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>Links</div>
                </div>
              </Tooltip>

              <Tooltip title="Number of images">
                <div style={{ textAlign: "center" }}>
                  <ImageIcon
                    size={20}
                    color={token.colorSuccess}
                    style={{ marginBottom: 4 }}
                  />
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {analysis.imageCount}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>Images</div>
                </div>
              </Tooltip>

              <Tooltip title="H1, H2, H3 headings">
                <div style={{ textAlign: "center" }}>
                  <FileText
                    size={20}
                    color={token.colorPrimaryActive}
                    style={{ marginBottom: 4 }}
                  />
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {analysis.headingCount}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>Headings</div>
                </div>
              </Tooltip>

              <Tooltip title="Bullet and numbered lists">
                <div style={{ textAlign: "center" }}>
                  <FileText
                    size={20}
                    color={token.colorWarning}
                    style={{ marginBottom: 4 }}
                  />
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {analysis.listCount}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>Lists</div>
                </div>
              </Tooltip>
            </div>

            {/* Character Counts */}
            <div
              style={{ display: "flex", gap: 16, fontSize: 13, color: "#666" }}
            >
              <span>
                Characters: {analysis.characterCount.toLocaleString()}
              </span>
              <span>•</span>
              <span>
                No spaces: {analysis.characterCountNoSpaces.toLocaleString()}
              </span>
            </div>
          </>
        )}

        {/* Content Issues & Recommendations */}
        {analysis.issues.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              💡 Content Recommendations
            </div>
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {analysis.issues.map((issue, index) => (
                <Alert
                  key={index}
                  message={issue.message}
                  type={
                    issue.type === "error"
                      ? "error"
                      : issue.type === "warning"
                      ? "warning"
                      : "info"
                  }
                  showIcon
                  icon={
                    issue.type === "error" ? (
                      <AlertCircle size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )
                  }
                  style={{ fontSize: 12, padding: "6px 12px" }}
                />
              ))}
            </Space>
          </div>
        )}

        {/* Perfect Content Message */}
        {analysis.issues.length === 0 && analysis.wordCount >= 50 && (
          <Alert
            message="Your content looks great! 🎉"
            description="Well-structured, easy to read, and engaging. Ready to convert!"
            type="success"
            showIcon
            icon={<CheckCircle size={16} />}
          />
        )}
      </Space>
    </Card>
  );
};

export default ContentStats;
