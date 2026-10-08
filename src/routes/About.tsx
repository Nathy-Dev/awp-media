import { useHead } from "../lib/useHead";

export default function About() {
  useHead({
    title: "About Our Church",
    description:
      "A New Testament-patterned local assembly where training believers for ministry, evangelism and prayer is the priority.",
    path: "/about",
  });

  return (
    <main className="about-section container" style={{ padding: "1.5rem 0" }}>
      <img
        src="/images/about-photo.png"
        alt="The Apostles of the Word and Prayer Worldwide congregation"
        width={1200}
        height={675}
        style={{ width: "100%", height: "auto" }}
        loading="eager"
        decoding="async"
      />

      <section className="about-intro" style={{ paddingTop: "1.5rem" }}>
        <h1>About Our Church</h1>
        <p style={{ textAlign: "left", lineHeight: 1.5 }}>
          Welcome to Apostles of the Word and Prayer Worldwide. We are a fellowship of believers in Christ
          alone, built upon the Gospel—everything Christ has done, His person, and His present ministry for the
          saints. We are a New Testament-patterned local assembly where the training of believers for ministry,
          with a strong emphasis on evangelism and teaching, is given top priority. Prayer is not reserved for
          a department; every believer is taught to acknowledge, receive, and minister prayer as a personal
          responsibility, making us truly a house of prayer. Reaching the unsaved is not an occasional effort—it
          is our daily lifestyle, our norm and culture. Every member, including pastors, serves as a volunteer;
          while we acknowledge the biblical right to support ministers, we have chosen to waive this for all.
          Though we are professionals in various fields, the daily work of the ministry and care for souls takes
          precedence. Needs are met among us through full expressions of the Spirit, and we boldly affirm that
          the gifts of the Spirit are in active demonstration in our midst.
        </p>
      </section>

      <section className="about-mission">
        <h2>Our Mission &amp; Vision</h2>
        <p style={{ textAlign: "left", lineHeight: 1.5 }}>
          To train men all over the world to become students of the Word and warriors in Prayer.
        </p>
      </section>

      <section className="about-leadership">
        <h2>Our Leadership</h2>
        <div className="leader-profile">
          <div>
            <h3>Pastor Daniel Usoro</h3>
            <p style={{ textAlign: "left", lineHeight: 1.5 }}>
              Pastor Daniel Usoro is the founder and lead shepherd of Apostles of the Word and Prayer Worldwide.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
