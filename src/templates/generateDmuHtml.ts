import {
  DEFAULT_CTA_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  type DmuActivity,
  type FacultyMember,
} from "../types/dmu.ts";

const PRIME_LOGO_URL = "images/PRIME_White.svg";
const WEBINAR_LOGO_URL = "images/live_webinar.svg";
const STYLESHEET_LINK = '<link rel="stylesheet" href="css/PRIME_DMU.css">';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export type DmuColors = {
  primary: string;
  secondary: string;
  cta: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cssColor(value: string, fallback: string): string {
  return HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
}

function registerHref(activityCode: string): string {
  const code = encodeURIComponent(activityCode);
  return `https://primeinc.org/${code}?utm_campaign=${code}&utm_source=MPT&utm_medium=DMU&hr=prime&action=reg`;
}

function showsLiveWebinar(activityCode: string): boolean {
  return activityCode.toUpperCase().includes("WC");
}

function webinarMarkup(): string {
  return `<div class="event-wrap">
                                <img src="${WEBINAR_LOGO_URL}" alt="Live webinar" class="brandLogo">
                            </div>`;
}

function facultyCard(member: FacultyMember, widthClass: string): string {
  const titles = escapeHtml(member.titles).replaceAll("\n", "<br>");
  return `<div class="${widthClass}">
                                        <img src="${escapeHtml(member.photo_url)}" class="img-moa" alt="${escapeHtml(member.name)}">
                                        <p class="a-center">${escapeHtml(member.role)}</p>
                                        <h4 class="a-center"><strong>${escapeHtml(member.name)}</strong></h4>
                                        <p class="a-center">${titles}</p>
                                    </div>`;
}

function facultyRow(className: string, members: FacultyMember[], widthClass: string): string {
  return `<div class="${className}">
                                    ${members.map((member) => facultyCard(member, widthClass)).join("\n")}
                                </div>`;
}

function facultyLayout(faculty: FacultyMember[]): string {
  switch (faculty.length) {
    case 0:
      return "";
    case 1:
      return facultyRow("flexRow u-mb30 justify-center", faculty, "w50");
    case 2:
      return facultyRow("flexRow u-mb30", faculty, "w50");
    case 3:
      return facultyRow("flexRow u-mb30", faculty, "w33");
    case 4:
      return [
        facultyRow("flexRow u-mb30", faculty.slice(0, 2), "w50"),
        facultyRow("flexRow u-mb30", faculty.slice(2), "w50"),
      ].join("\n");
    case 5:
      return [
        facultyRow("flexRow u-mb30", faculty.slice(0, 3), "w33"),
        facultyRow("flexRow u-mb30 justify-center", faculty.slice(3), "w50"),
      ].join("\n");
    default: {
      const rows: string[] = [];
      for (let index = 0; index < faculty.length; index += 3) {
        rows.push(facultyRow("flexRow u-mb30", faculty.slice(index, index + 3), "w33"));
      }
      return rows.join("\n");
    }
  }
}

export function generateDmuHtml(activity: DmuActivity, colors: DmuColors): string {
  const primary = cssColor(colors.primary, DEFAULT_PRIMARY_COLOR);
  const secondary = cssColor(colors.secondary, DEFAULT_SECONDARY_COLOR);
  const cta = cssColor(colors.cta, DEFAULT_CTA_COLOR);
  const title = escapeHtml(activity.title);
  const date = escapeHtml(activity.date);
  const credits = escapeHtml(String(activity.cme_credits));
  const artworkUrl = escapeHtml(activity.artwork_url);
  const support = escapeHtml(activity.commercial_support_statement);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <meta name="description" content="">
    <meta name="author" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${STYLESHEET_LINK}
    <style>
      :root { --headerbg: ${primary}; --flexfiller: ${primary}; --snapshotBG: ${secondary}; --ctabutton: ${cta}; }
      #DMU .nav-wrap .brandLogo { width: auto; height: 36px; max-width: 160px; }
    </style>
</head>
<body style="background-color: #e6e6e6;">
    <div id="DMU" class="dmuWrapper" style="background-color: #e6e6e6;">
        <div class="flex-container">
            <div class="flex-large mobile-flex">
                <div class="mobile-scroll">
                    <div class="content desktop-flex-item">
                        <div class="gradient-wrap">
                            <div class="nav-wrap">
                                <img src="${PRIME_LOGO_URL}" alt="Logo" class="brandLogo">
                            </div>
                            <h1 style="color:#000000;">${title}</h1>
                            ${showsLiveWebinar(activity.activityCode) ? webinarMarkup() : ""}
                            <div class="date-wrap">
                                <h5 class="u-mb0">${date}</h5>
                            </div>
                        </div>
                        <div class="flexRow break-iPad-p">
                            <div class="mw500 z5">
                                <img src="${artworkUrl}" alt="Activity artwork" class="img-ladies">
                            </div>
                            <div class="snapshot">
                                <a class="cta" href="${registerHref(activity.activityCode)}" target="_blank">REGISTER NOW!</a>
                                <br><br>
                                <div align="center">
                                    <h2 class="u-mb0">FREE <strong>${credits} CME/CE</strong></h2>
                                </div>
                            </div>
                        </div>
                        <div class="blueBG">
                            <h3 class="u-mb0 whitetext"><strong>OVERVIEW</strong></h3>
                        </div>
                        <div class="sectionBG flexRow">
                            <div class="w100">
                                ${activity.overview}
                                <p class="u-mb40"></p>
                            </div>
                        </div>
                        <div class="blueBG">
                            <h3 class="u-mb0"><strong>FACULTY</strong></h3>
                        </div>
                        <div class="darkBG">
                            ${facultyLayout(activity.faculty)}
                        </div>
                        <div class="desktop mt0">
                            <div class="footer">
                                <img src="${PRIME_LOGO_URL}" alt="PRIME logo" class="PrimeLogo">
                                <p class="signoff"><br>${support}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

export function withPreviewCss(html: string, css: string): string {
  const safeCss = css.replaceAll("</style", "<\\/style");
  return html.replace(STYLESHEET_LINK, `${STYLESHEET_LINK}\n    <style>${safeCss}</style>`);
}
