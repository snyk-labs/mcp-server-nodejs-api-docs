import { initLogger } from "../utils/logger.js";

const logger = initLogger();

export async function initializeNodejsResources(server) {
  logger.info({ msg: "Initializing Node.js resources..." });

  const resourceNodejsReleasesChartURL =
    "https://raw.githubusercontent.com/nodejs/Release/main/schedule.svg?sanitize=true";
  const resourceNodejsReleasesChart = await fetch(
    resourceNodejsReleasesChartURL
  );

  if (!resourceNodejsReleasesChart.ok) {
    logger.error({
      msg: `Failed to fetch Node.js releases chart: ${resourceNodejsReleasesChart.status} ${resourceNodejsReleasesChart.statusText}`,
    });
    throw new Error(
      `Failed to fetch Node.js releases chart: ${resourceNodejsReleasesChart.status} ${resourceNodejsReleasesChart.statusText}`
    );
  }

  const resourceNodejsReleasesChartSVGText =
  await resourceNodejsReleasesChart.text();

  server.resource(
    "nodejs",
    "nodejs://releases-schedule-chart.svg",
    async (uri) => {
      logger.info({ msg: "Resource URI Access:", uri });

      return {
        contents: [
          {
            uri: uri.href,
            text: resourceNodejsReleasesChartSVGText
          },
        ],
      };
    }
  );
}
