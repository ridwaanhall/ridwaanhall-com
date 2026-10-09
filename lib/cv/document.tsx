import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Cv } from "./select";

/*
 * The CV as a document an applicant tracking system can read: one column, in
 * reading order; the standard section names; real selectable text set in a
 * standard face (no ligatures to break a word); contact details in the body;
 * plain hyphens for bullets; no images, tables or icons. The first third of
 * page one is what a recruiter reads in six seconds: the name, the roles
 * looked for, the contacts and the summary.
 */

// A word is never split across a line: a parser reads "oppor" and "tunities".
Font.registerHyphenationCallback((word) => [word]);

const INK = "#111111";
const MUTE = "#555555";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 46, fontFamily: "Helvetica", fontSize: 9.5, lineHeight: 1.4, color: INK },
  name: { fontFamily: "Helvetica-Bold", fontSize: 22, lineHeight: 1.15, marginBottom: 6 },
  headline: { fontSize: 11, color: INK, marginBottom: 5 },
  contact: { fontSize: 9, color: MUTE, marginBottom: 12 },
  h: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 12, marginBottom: 4, paddingBottom: 2, borderBottomWidth: 0.6, borderBottomColor: INK, borderBottomStyle: "solid" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  strong: { fontFamily: "Helvetica-Bold" },
  mute: { color: MUTE },
  point: { flexDirection: "row", marginTop: 1.5 },
  dash: { width: 10 },
  grow: { flex: 1 },
  link: { color: INK, textDecoration: "underline" },
});

const Points = ({ items }: { items: string[] }) => (
  <>
    {items.map((item) => (
      <View key={item} style={s.point} wrap={false}>
        <Text style={s.dash}>-</Text>
        <Text style={s.grow}>{item}</Text>
      </View>
    ))}
  </>
);

export function CvDocument({ cv, username }: { cv: Cv; username: string }) {
  return (
    <Document
      title={`${cv.name}, CV`}
      author={cv.name}
      subject="Curriculum vitae"
      keywords={[cv.headline, ...cv.skills.slice(0, 3)].join(", ")}
      creator="ridwaanhall.com"
      producer="ridwaanhall.com"
    >
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{cv.name}</Text>
        <Text style={s.headline}>{cv.headline}</Text>
        <Text style={s.contact}>
          {cv.contact.map((line, i) => (
            <Text key={line}>
              {i > 0 ? "  |  " : ""}
              {line.startsWith("github.com") || line.startsWith("linkedin.com") ? <Link src={`https://${line}`} style={s.link}>{line}</Link> : line}
            </Text>
          ))}
        </Text>

        {cv.summary && (
          <>
            <Text style={s.h}>Summary</Text>
            <Text>{cv.summary}</Text>
          </>
        )}

        <Text style={s.h}>Skills</Text>
        {cv.skills.map((line) => (
          <Text key={line} style={{ marginTop: 1.5 }}>
            {line}
          </Text>
        ))}

        <Text style={s.h}>Experience</Text>
        {cv.experience.map((role) => (
          <View key={role.company + role.period} wrap={false}>
            <View style={s.row}>
              <Text style={s.strong}>
                {role.title}, {role.company}
              </Text>
              <Text style={s.mute}>{role.period}</Text>
            </View>
            <Points items={role.points} />
          </View>
        ))}

        {cv.projects.length > 0 && (
          <>
            <Text style={s.h}>Projects</Text>
            {cv.projects.map((project) => (
              <Text key={project.title} style={{ marginTop: 2 }}>
                <Text style={s.strong}>{project.title}</Text>
                {`: ${project.line}`}
              </Text>
            ))}
          </>
        )}

        <Text style={s.h}>Education and training</Text>
        {cv.education.map((e) => (
          <View key={e.institution + e.degree} style={s.row} wrap={false}>
            <Text>
              <Text style={s.strong}>{e.degree}</Text>, {e.institution}
            </Text>
            <Text style={s.mute}>{e.years}</Text>
          </View>
        ))}

        {cv.certifications.length > 0 && (
          <>
            <Text style={s.h}>Certifications</Text>
            <Points items={cv.certifications} />
          </>
        )}

        <Text style={[s.mute, { marginTop: 14, fontSize: 8 }]}>
          Generated from ridwaanhall.com/about, so it follows the page. github.com/{username}
        </Text>
      </Page>
    </Document>
  );
}
