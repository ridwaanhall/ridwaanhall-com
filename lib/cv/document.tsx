import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Cv } from "./select";

/*
 * The CV as a document an applicant tracking system can read: one column, in
 * reading order; the standard section names; real selectable text set in a
 * standard face; contact details in the body; plain hyphens for bullets; no
 * images, tables or icons. Design lives in weight, size and rules only: a
 * letter-spaced heading is read back as separate letters, so none is tracked,
 * and nothing sits in a side column that a parser would read out of order.
 * The first third of page one is what a recruiter reads in six seconds: the
 * name, the roles looked for, the contacts and the summary.
 */

// A word is never split across a line: a parser reads "oppor" and "tunities".
Font.registerHyphenationCallback((word) => [word]);

const INK = "#111111";
const MUTE = "#5a5a5a";
const RULE = "#c9c9c9";

const s = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 42, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 9.5, lineHeight: 1.42, color: INK },
  head: { borderBottomWidth: 2, borderBottomColor: INK, borderBottomStyle: "solid", paddingBottom: 10, marginBottom: 4 },
  name: { fontFamily: "Helvetica-Bold", fontSize: 27, lineHeight: 1.1, marginBottom: 5 },
  headline: { fontSize: 11.5, color: MUTE, marginBottom: 7 },
  contact: { fontSize: 9, color: INK },
  section: { marginTop: 14 },
  h: { fontFamily: "Helvetica-Bold", fontSize: 10, textTransform: "uppercase", marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.75, borderBottomColor: RULE, borderBottomStyle: "solid" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  role: { marginBottom: 8 },
  strong: { fontFamily: "Helvetica-Bold" },
  mute: { color: MUTE },
  point: { flexDirection: "row", marginTop: 2, paddingLeft: 2 },
  dash: { width: 11, color: MUTE },
  grow: { flex: 1 },
  skill: { flexDirection: "row", marginBottom: 2.5 },
  skillLabel: { width: 112, fontFamily: "Helvetica-Bold" },
  link: { color: INK, textDecoration: "underline" },
  foot: { marginTop: 16, fontSize: 8, color: MUTE },
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

/** "Languages: Python, PHP" is a label and its values, set as two runs on one line. */
const split = (line: string): [string, string] => {
  const at = line.indexOf(": ");
  return at > 0 ? [line.slice(0, at), line.slice(at + 2)] : ["", line];
};

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
        <View style={s.head}>
          <Text style={s.name}>{cv.name}</Text>
          <Text style={s.headline}>{cv.headline}</Text>
          <Text style={s.contact}>
            {cv.contact.map((line, i) => (
              <Text key={line.text}>
                {i > 0 ? "   |   " : ""}
                {line.href ? (
                  <Link src={line.href} style={s.link}>
                    {line.text}
                  </Link>
                ) : (
                  line.text
                )}
              </Text>
            ))}
          </Text>
        </View>

        {cv.summary && (
          <View style={s.section}>
            <Text style={s.h}>Summary</Text>
            <Text>{cv.summary}</Text>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.h}>Skills</Text>
          {cv.skills.map((line) => {
            const [label, values] = split(line);
            return (
              <View key={line} style={s.skill} wrap={false}>
                {label ? <Text style={s.skillLabel}>{label}</Text> : null}
                <Text style={s.grow}>{values}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.section}>
          <Text style={s.h}>Experience</Text>
          {cv.experience.map((role) => (
            <View key={role.company + role.period} style={s.role} wrap={false}>
              <View style={s.row}>
                <Text>
                  <Text style={s.strong}>{role.title}</Text>
                  <Text style={s.mute}>{`, ${role.company}`}</Text>
                </Text>
                <Text style={s.mute}>{role.period}</Text>
              </View>
              <Points items={role.points} />
            </View>
          ))}
        </View>

        {cv.projects.length > 0 && (
          <View style={s.section}>
            <Text style={s.h}>Projects</Text>
            {cv.projects.map((project) => (
              <Text key={project.title} style={{ marginBottom: 3 }}>
                <Text style={s.strong}>{project.title}</Text>
                {`: ${project.line}`}
              </Text>
            ))}
          </View>
        )}

        <View style={s.section}>
          <Text style={s.h}>Education</Text>
          {cv.education.map((e) => (
            <View key={e.institution + e.degree} style={s.row} wrap={false}>
              <Text>
                <Text style={s.strong}>{e.degree}</Text>
                <Text style={s.mute}>{`, ${e.institution}`}</Text>
              </Text>
              <Text style={s.mute}>{e.years}</Text>
            </View>
          ))}
        </View>

        {cv.certifications.length > 0 && (
          <View style={s.section}>
            <Text style={s.h}>Certifications</Text>
            <Points items={cv.certifications} />
          </View>
        )}

        <Text style={s.foot}>Generated from ridwaanhall.com/about, so it follows the page. github.com/{username}</Text>
      </Page>
    </Document>
  );
}
