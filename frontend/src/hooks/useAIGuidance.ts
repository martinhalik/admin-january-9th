import { useMemo } from "react";
import { MerchantAccount } from "../data/merchantAccounts";
import {
  AIGuidance,
  Suggestion,
  Warning,
  Optimization,
  GeneratedOption,
} from "../lib/aiRecommendations";

interface UseAIGuidanceProps {
  stage: "category" | "subcategory" | "options" | "review";
  merchantAccount?: MerchantAccount | null;
  selectedCategory?: string | null;
  selectedSubcategory?: string | null;
  selectedOptions?: GeneratedOption[];
  onAction?: (action: string, data?: any) => void;
}

export const useAIGuidance = ({
  stage,
  merchantAccount,
  selectedCategory,
  selectedSubcategory,
  selectedOptions = [],
  onAction,
}: UseAIGuidanceProps): AIGuidance => {
  const guidance = useMemo(() => {
    const suggestions: Suggestion[] = [];
    const warnings: Warning[] = [];
    const optimizations: Optimization[] = [];
    const nextSteps: string[] = [];

    // ========================================================================
    // CATEGORY SELECTION STAGE
    // ========================================================================
    if (stage === "category") {
      // Suggestions based on merchant data
      if (merchantAccount) {
        // Market timing insight
        const currentMonth = new Date().getMonth();
        const isHighSeason = currentMonth >= 3 && currentMonth <= 8; // April-Sept
        
        if (isHighSeason) {
          suggestions.push({
            id: "seasonal",
            type: "tip",
            title: "Peak Season Advantage",
            description:
              "This is peak season for most categories. Expect 20-30% higher conversion rates.",
          });
        }
      }

      // Next steps for category selection
      nextSteps.push("Review AI-recommended category based on business type");
      nextSteps.push("Compare potential revenue across categories");
      nextSteps.push("Check market trends and competition levels");
      nextSteps.push("Select category to proceed to options");
    }

    // ========================================================================
    // SUBCATEGORY SELECTION STAGE
    // ========================================================================
    else if (stage === "subcategory") {
      if (selectedCategory) {
        suggestions.push({
          id: "subcategory-tip",
          type: "info",
          title: "Refine Your Targeting",
          description:
            "Choosing the right subcategory helps customers find your deal faster and improves conversion rates by up to 18%.",
        });

        // Category-specific advice
        if (selectedCategory === "food-drink") {
          suggestions.push({
            id: "food-timing",
            type: "tip",
            title: "Dining Deal Strategy",
            description:
              "Consider offering both lunch and dinner options. Lunch deals convert 15% better during weekdays.",
          });
        } else if (selectedCategory === "health-beauty") {
          suggestions.push({
            id: "beauty-bundling",
            type: "tip",
            title: "Bundle for Value",
            description:
              "Spa and beauty packages with multiple services see 32% higher average order values.",
          });
        }
      }

      nextSteps.push("Select the subcategory that best describes your offering");
      nextSteps.push("Review AI-recommended subcategory for your business");
      nextSteps.push("Proceed to pricing options");
    }

    // ========================================================================
    // OPTIONS SELECTION STAGE
    // ========================================================================
    else if (stage === "options") {
      // Number of options guidance
      const optionCount = selectedOptions.length;

      if (optionCount === 0) {
        warnings.push({
          id: "no-options",
          message: "Select at least one pricing option to proceed",
          severity: "high",
        });
      } else if (optionCount === 1) {
        suggestions.push({
          id: "single-option",
          type: "info",
          title: "Consider Multiple Options",
          description:
            "Deals with 2-3 options convert 24% better by appealing to different customer segments.",
          action: {
            label: "Select More Options",
            handler: () => onAction?.("add_option"),
          },
        });
      } else if (optionCount === 2) {
        suggestions.push({
          id: "two-options",
          type: "success",
          title: "Good Option Mix",
          description:
            "Two options provide choice without overwhelming customers. Consider adding a premium tier.",
        });
      } else if (optionCount >= 3) {
        suggestions.push({
          id: "three-plus-options",
          type: "success",
          title: "Excellent Variety",
          description:
            "Great! Multiple price tiers maximize your market reach and revenue potential.",
        });
      }

      // Pricing strategy insights
      if (selectedOptions.length > 0) {
        const avgDiscount =
          selectedOptions.reduce((sum, opt) => sum + opt.discount, 0) /
          selectedOptions.length;

        if (avgDiscount < 30) {
          warnings.push({
            id: "low-discount",
            message:
              "Your average discount is below 30%. Higher discounts (35-40%) typically perform better on Groupon.",
            severity: "medium",
          });

          optimizations.push({
            id: "increase-discount",
            title: "Optimize Discount Level",
            description:
              "Increase discount to 35-40% range to match top-performing deals",
            expectedImpact: 18,
            apply: () => onAction?.("optimize_discount"),
          });
        } else if (avgDiscount > 50) {
          warnings.push({
            id: "high-discount",
            message:
              "Your discount exceeds 50%. While attractive, ensure your margins remain healthy.",
            severity: "medium",
          });
        } else {
          suggestions.push({
            id: "good-discount",
            type: "success",
            title: "Optimal Discount Range",
            description:
              "Your discounts are in the sweet spot (33-45%) for maximum conversion with healthy margins.",
          });
        }

        // Price spread analysis
        const prices = selectedOptions.map((opt) => opt.grouponPrice).sort((a, b) => a - b);
        if (prices.length >= 2) {
          const priceRange = prices[prices.length - 1] - prices[0];
          const avgPrice =
            prices.reduce((sum, price) => sum + price, 0) / prices.length;
          const rangeRatio = priceRange / avgPrice;

          if (rangeRatio < 1) {
            suggestions.push({
              id: "narrow-range",
              type: "tip",
              title: "Consider Price Diversity",
              description:
                "Your options are closely priced. A wider range (e.g., $25, $50, $100) can appeal to more customer segments.",
            });
          }
        }

        // Confidence-based suggestion
        const highConfidenceOptions = selectedOptions.filter(
          (opt) => opt.confidence > 0.9
        );
        if (highConfidenceOptions.length > 0) {
          suggestions.push({
            id: "high-confidence",
            type: "success",
            title: "AI-Validated Pricing",
            description: `${highConfidenceOptions.length} of your options have 90%+ confidence scores - excellent choices!`,
          });
        }
      }

      // Optimization suggestions
      if (merchantAccount?.potential === "high" && optionCount >= 2) {
        optimizations.push({
          id: "add-premium",
          title: "Add Premium Tier",
          description:
            "High-potential merchants see 40% of customers choosing premium options",
          expectedImpact: 22,
          apply: () => onAction?.("add_premium_option"),
        });
      }

      nextSteps.push("Review AI-generated pricing recommendations");
      nextSteps.push("Select 2-3 options for optimal market coverage");
      nextSteps.push("Customize options if needed");
      nextSteps.push("Proceed to deal preview");
    }

    // ========================================================================
    // REVIEW STAGE
    // ========================================================================
    else if (stage === "review") {
      // Final validation checks
      if (!selectedCategory) {
        warnings.push({
          id: "no-category",
          message: "Category is required",
          severity: "high",
        });
      }

      if (selectedOptions.length === 0) {
        warnings.push({
          id: "no-options-review",
          message: "At least one pricing option is required",
          severity: "high",
        });
      }

      // Success confirmation
      if (selectedCategory && selectedOptions.length >= 2) {
        suggestions.push({
          id: "ready-to-launch",
          type: "success",
          title: "Ready to Create",
          description:
            "Your deal setup looks great! All essential elements are in place for a successful campaign.",
        });
      }

      // Projected performance
      if (selectedOptions.length > 0) {
        const totalProjected = selectedOptions.reduce(
          (sum, opt) => sum + opt.projectedSales * opt.grouponPrice,
          0
        );
        
        suggestions.push({
          id: "projected-revenue",
          type: "info",
          title: "Revenue Projection",
          description: `Based on market analysis, this deal could generate $${totalProjected.toLocaleString()} in the first 30 days.`,
        });
      }

      // Final optimizations
      optimizations.push({
        id: "add-images",
        title: "Prepare High-Quality Images",
        description:
          "Deals with 5+ professional images see 35% higher conversion rates",
        expectedImpact: 35,
        apply: () => onAction?.("add_images_reminder"),
      });

      optimizations.push({
        id: "write-compelling-copy",
        title: "Craft Compelling Description",
        description:
          "Use emotional language and highlight unique benefits to boost engagement",
        expectedImpact: 28,
        apply: () => onAction?.("copy_tips"),
      });

      nextSteps.push("Review all selections and projected performance");
      nextSteps.push("Create deal draft");
      nextSteps.push("Add images and detailed description");
      nextSteps.push("Submit for approval");
    }

    return {
      step: stage,
      suggestions,
      warnings,
      optimizations,
      nextSteps,
    };
  }, [
    stage,
    merchantAccount,
    selectedCategory,
    selectedSubcategory,
    selectedOptions,
    onAction,
  ]);

  return guidance;
};

