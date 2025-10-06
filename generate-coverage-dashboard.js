#!/usr/bin/env node

/**
 * @fileoverview Centralized coverage dashboard generator for CAWS compliance
 * @author @darianrosebrook
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class CoverageDashboard {
  constructor() {
    this.coverageDir = "coverage";
    this.outputDir = "coverage/dashboard";
    this.packages = this.discoverPackages();
  }

  discoverPackages() {
    try {
      const workspaceConfig = JSON.parse(
        fs.readFileSync("pnpm-workspace.yaml", "utf8")
      );
      const packages = [];

      workspaceConfig.packages.forEach((pattern) => {
        const expanded = pattern.replace("/*", "");
        if (fs.existsSync(expanded)) {
          const dirs = fs
            .readdirSync(expanded, { withFileTypes: true })
            .filter(
              (dirent) =>
                dirent.isDirectory() &&
                fs.existsSync(path.join(expanded, dirent.name, "package.json"))
            )
            .map((dirent) => path.join(expanded, dirent.name));
          packages.push(...dirs);
        }
      });

      return packages;
    } catch (error) {
      console.error("Error discovering packages:", error.message);
      return [];
    }
  }

  async generateDashboard() {
    console.log("📊 Generating CAWS Coverage Dashboard...");

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Collect coverage data
    const coverageData = await this.collectCoverageData();

    // Generate HTML dashboard
    const dashboardHtml = this.generateDashboardHtml(coverageData);

    // Write dashboard file
    fs.writeFileSync(path.join(this.outputDir, "index.html"), dashboardHtml);

    // Generate summary report
    const summary = this.generateSummaryReport(coverageData);
    fs.writeFileSync(
      path.join(this.outputDir, "summary.json"),
      JSON.stringify(summary, null, 2)
    );

    console.log(`✅ Dashboard generated: ${this.outputDir}/index.html`);
    return summary;
  }

  async collectCoverageData() {
    const coverageData = {
      packages: {},
      overall: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
      timestamp: new Date().toISOString(),
    };

    for (const packagePath of this.packages) {
      const packageName = path.basename(packagePath);
      const coveragePath = path.join(
        packagePath,
        "coverage",
        "coverage-final.json"
      );

      if (fs.existsSync(coveragePath)) {
        try {
          const packageCoverage = JSON.parse(
            fs.readFileSync(coveragePath, "utf8")
          );
          coverageData.packages[packageName] = {
            statements: packageCoverage.total?.statements?.pct || 0,
            branches: packageCoverage.total?.branches?.pct || 0,
            functions: packageCoverage.total?.functions?.pct || 0,
            lines: packageCoverage.total?.lines?.pct || 0,
          };

          // Accumulate overall totals (simplified averaging)
          coverageData.overall.statements +=
            coverageData.packages[packageName].statements;
          coverageData.overall.branches +=
            coverageData.packages[packageName].branches;
          coverageData.overall.functions +=
            coverageData.packages[packageName].functions;
          coverageData.overall.lines +=
            coverageData.packages[packageName].lines;
        } catch (error) {
          console.warn(`Warning: Could not parse coverage for ${packageName}`);
        }
      }
    }

    // Calculate overall averages
    const packageCount = Object.keys(coverageData.packages).length;
    if (packageCount > 0) {
      coverageData.overall.statements /= packageCount;
      coverageData.overall.branches /= packageCount;
      coverageData.overall.functions /= packageCount;
      coverageData.overall.lines /= packageCount;
    }

    return coverageData;
  }

  generateDashboardHtml(coverageData) {
    const cawsTier = this.determineCawsTier(coverageData.overall);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAWS Coverage Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }
        .caws-badge {
            display: inline-block;
            padding: 8px 16px;
            background: ${cawsTier.color};
            color: white;
            border-radius: 20px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            color: #666;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 1px;
        }
        .packages-section {
            margin-top: 40px;
        }
        .package-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .package-name {
            font-weight: bold;
        }
        .package-metrics {
            display: flex;
            gap: 20px;
        }
        .metric {
            text-align: center;
        }
        .metric-value-small {
            font-size: 1.2em;
            font-weight: bold;
        }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-danger { color: #dc3545; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="caws-badge">CAWS Tier ${cawsTier.level}</div>
            <h1>CAWS Coverage Dashboard</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">Overall Statements</div>
                <div class="metric-value">${coverageData.overall.statements.toFixed(
                  1
                )}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Overall Branches</div>
                <div class="metric-value">${coverageData.overall.branches.toFixed(
                  1
                )}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Overall Functions</div>
                <div class="metric-value">${coverageData.overall.functions.toFixed(
                  1
                )}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Overall Lines</div>
                <div class="metric-value">${coverageData.overall.lines.toFixed(
                  1
                )}%</div>
            </div>
        </div>

        <div class="packages-section">
            <h2>Package Coverage Details</h2>
            ${Object.entries(coverageData.packages)
              .map(
                ([packageName, metrics]) => `
                <div class="package-item">
                    <div class="package-name">@paths-design/${packageName}</div>
                    <div class="package-metrics">
                        <div class="metric">
                            <div class="metric-value-small">${metrics.statements.toFixed(
                              1
                            )}%</div>
                            <div class="metric-label">Statements</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value-small">${metrics.branches.toFixed(
                              1
                            )}%</div>
                            <div class="metric-label">Branches</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value-small">${metrics.functions.toFixed(
                              1
                            )}%</div>
                            <div class="metric-label">Functions</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value-small">${metrics.lines.toFixed(
                              1
                            )}%</div>
                            <div class="metric-label">Lines</div>
                        </div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>

        <div class="footer">
            <p><strong>CAWS Compliance:</strong> ${cawsTier.description}</p>
            <p>This dashboard shows coverage metrics for Tier ${
              cawsTier.level
            } compliance requirements.</p>
        </div>
    </div>
</body>
</html>`;
  }

  determineCawsTier(overall) {
    const avgCoverage =
      (overall.statements +
        overall.branches +
        overall.functions +
        overall.lines) /
      4;

    if (avgCoverage >= 90) {
      return {
        level: 1,
        color: "#28a745",
        description: "Exceeds Tier 1 requirements (≥90% coverage)",
      };
    } else if (avgCoverage >= 80) {
      return {
        level: 2,
        color: "#007bff",
        description: "Meets Tier 2 requirements (≥80% coverage)",
      };
    } else if (avgCoverage >= 70) {
      return {
        level: 3,
        color: "#ffc107",
        description: "Meets Tier 3 requirements (≥70% coverage)",
      };
    } else {
      return {
        level: "FAIL",
        color: "#dc3545",
        description: "Below minimum CAWS requirements",
      };
    }
  }

  generateSummaryReport(coverageData) {
    return {
      timestamp: coverageData.timestamp,
      overall: coverageData.overall,
      packages: coverageData.packages,
      cawsTier: this.determineCawsTier(coverageData.overall),
      recommendations: this.generateRecommendations(coverageData),
    };
  }

  generateRecommendations(coverageData) {
    const recommendations = [];
    const overall = coverageData.overall;

    if (overall.statements < 80) {
      recommendations.push(
        "Increase statement coverage to meet Tier 2 requirements"
      );
    }
    if (overall.branches < 80) {
      recommendations.push(
        "Increase branch coverage to meet Tier 2 requirements"
      );
    }
    if (overall.functions < 80) {
      recommendations.push(
        "Increase function coverage to meet Tier 2 requirements"
      );
    }

    // Check for packages with low coverage
    Object.entries(coverageData.packages).forEach(([packageName, metrics]) => {
      const avg =
        (metrics.statements +
          metrics.branches +
          metrics.functions +
          metrics.lines) /
        4;
      if (avg < 70) {
        recommendations.push(
          `Improve coverage for @paths-design/${packageName} (currently ${avg.toFixed(
            1
          )}%)`
        );
      }
    });

    return recommendations;
  }
}

// CLI execution
if (require.main === module) {
  const dashboard = new CoverageDashboard();
  dashboard
    .generateDashboard()
    .then((summary) => {
      console.log("📋 Coverage Summary:");
      console.log(
        `Overall Coverage: ${summary.overall.statements.toFixed(
          1
        )}% statements, ${summary.overall.branches.toFixed(1)}% branches`
      );
      console.log(`CAWS Tier: ${summary.cawsTier.level}`);
      if (summary.recommendations.length > 0) {
        console.log("📝 Recommendations:");
        summary.recommendations.forEach((rec) => console.log(`  - ${rec}`));
      }
    })
    .catch((error) => {
      console.error("❌ Error generating dashboard:", error.message);
      process.exit(1);
    });
}

module.exports = CoverageDashboard;
