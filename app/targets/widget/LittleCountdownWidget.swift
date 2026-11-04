import SwiftUI
import WidgetKit

// Must match APP_GROUP in src/widgets/sync.ios.ts and the entitlement in app.json.
private let appGroup = "group.com.cynthiachuang.littlecountdown"

// MARK: - Data the app shares (see `snapshot()` in src/lib/core.ts)

struct Snapshot: Codable {
  var due: String
  var leave: String
  var name: String
  var off: [String]
  var joys: [String: String]
  var theme: String?
  var born: String?
  var babyName: String?
  var milestones: [MilestoneDate]?
}

struct MilestoneDate: Codable {
  var date: String
  var title: String
}

struct Numbers {
  var babyDays: Int
  var leaveDays: Int
  var workdays: Int
  var week: Int
  var joy: String
  var isExample: Bool
  var look = "calm"
  var born = false

  // What the widget shows. Before birth: days to baby and to leave. After: baby's age and the next milestone.
  var leftNum: Int = 0
  var leftShort = "baby"
  var leftLabel = "days to baby"
  var rightNum: Int = 0
  var rightShort = "leave"
  var rightLabel = ""
  var tag = ""
  var inline = ""
}

private let dayFormatter: DateFormatter = {
  let f = DateFormatter()
  f.calendar = Calendar(identifier: .gregorian)
  f.locale = Locale(identifier: "en_US_POSIX")
  f.timeZone = .current
  f.dateFormat = "yyyy-MM-dd"
  return f
}()

private func loadSnapshot() -> Snapshot? {
  guard let raw = UserDefaults(suiteName: appGroup)?.string(forKey: "snapshot"),
        let data = raw.data(using: .utf8) else { return nil }
  return try? JSONDecoder().decode(Snapshot.self, from: data)
}

/// Same rules as `widgetNumbers()` in the app, so the widget stays right on days the app isn't opened.
func numbers(on date: Date) -> Numbers {
  let cal = Calendar.current
  let today = cal.startOfDay(for: date)
  let snap = loadSnapshot()
  let due = snap.flatMap { dayFormatter.date(from: $0.due) } ?? cal.date(byAdding: .day, value: 132, to: today)!
  let leave = snap.flatMap { dayFormatter.date(from: $0.leave) } ?? cal.date(byAdding: .day, value: 116, to: today)!
  let off = Set(snap?.off ?? [])

  func days(_ a: Date, _ b: Date) -> Int { cal.dateComponents([.day], from: a, to: cal.startOfDay(for: b)).day ?? 0 }

  var workdays = 0
  var d = today
  while d < leave {
    let wd = cal.component(.weekday, from: d) // 1 = Sunday, 7 = Saturday
    if wd != 1 && wd != 7 && !off.contains(dayFormatter.string(from: d)) { workdays += 1 }
    d = cal.date(byAdding: .day, value: 1, to: d)!
  }

  let start = cal.date(byAdding: .day, value: -280, to: due)!
  let week = min(42, max(0, days(start, today)) / 7)
  let joy = snap?.joys[dayFormatter.string(from: today)] ?? "Take a slow breath. You're doing great."

  var n = Numbers(babyDays: max(0, days(today, due)), leaveDays: max(0, days(today, leave)),
                  workdays: workdays, week: week, joy: joy, isExample: snap == nil, look: snap?.theme ?? "calm", born: snap?.born != nil)
  n.leftNum = n.babyDays
  n.leftLabel = n.babyDays == 1 ? "day to baby" : "days to baby"
  n.rightNum = n.leaveDays
  n.rightLabel = "\(workdays) workdays to leave"
  n.tag = "Week \(week)"
  n.inline = "\(n.babyDays) days to baby · \(n.leaveDays) to leave"

  if let bornText = snap?.born, let born = dayFormatter.date(from: bornText) {
    // Same rules as babyAge() in the app: days, then weeks, then months, then years.
    let ageDays = max(0, days(born, today))
    let months = max(0, cal.dateComponents([.month], from: born, to: today).month ?? 0)
    var num = ageDays, unit = ageDays == 1 ? "day old" : "days old", short = "days"
    if ageDays >= 14 && months < 2 { num = ageDays / 7; unit = "weeks old"; short = "wks" }
    else if months >= 12 { num = months / 12; unit = num == 1 ? "year old" : "years old"; short = "yrs" }
    else if months >= 2 { num = months; unit = "months old"; short = "mo" }
    let next = (snap?.milestones ?? []).first { m in
      guard let d = dayFormatter.date(from: m.date) else { return false }
      return d >= today
    }
    let nextDays = next.flatMap { dayFormatter.date(from: $0.date) }.map { days(today, $0) } ?? 0
    let who = (snap?.babyName ?? "").isEmpty ? "Baby" : snap!.babyName!
    n.leftNum = num
    n.leftShort = short
    n.leftLabel = unit
    n.rightNum = nextDays
    n.rightShort = "to go"
    n.rightLabel = next == nil ? "Growing every day" : nextDays == 0 ? "\(next!.title) today!" : "days to \(next!.title)"
    n.tag = who
    n.inline = next == nil ? "\(who) is \(num) \(unit)" : "\(who) is \(num) \(short) · \(nextDays)d to \(next!.title)"
  }
  return n
}

// MARK: - Timeline

struct Entry: TimelineEntry {
  let date: Date
  let n: Numbers
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry {
    Entry(date: .now, n: Numbers(babyDays: 132, leaveDays: 116, workdays: 76, week: 21, joy: "Plan one more date night before baby arrives.", isExample: true,
                                 leftNum: 132, leftLabel: "days to baby", rightNum: 116, rightLabel: "76 workdays to leave", tag: "Week 21",
                                 inline: "132 days to baby · 116 to leave"))
  }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : Entry(date: .now, n: numbers(on: .now)))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    // Entries for now, each midnight (new countdown numbers) and 6 am / 7 pm (Sky's day and night), for 3 days.
    let cal = Calendar.current
    var entries = [Entry(date: .now, n: numbers(on: .now))]
    let start = cal.startOfDay(for: .now)
    var next = start
    for day in 0..<3 {
      let base = cal.date(byAdding: .day, value: day, to: start)!
      for hour in [6, 19, 24] {
        let at = cal.date(byAdding: .hour, value: hour, to: base)!
        if at > .now { entries.append(Entry(date: at, n: numbers(on: at))); next = at }
      }
    }
    completion(Timeline(entries: entries, policy: .after(next)))
  }
}

// MARK: - Look

extension Color {
  static func dyn(_ light: UInt32, _ dark: UInt32) -> Color {
    Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
  }
}

/// Colors for each look, matching src/lib/looks.ts in the app. Sky follows the time of day.
struct Pal {
  let ink, muted, rose, roseSoft, sage, sageSoft, surface: Color
  let radius: CGFloat
  let numberDesign: Font.Design

  // light then dark: surface, ink, muted, rose, roseSoft, sage, sageSoft
  private static let table: [String: ([UInt32], [UInt32])] = [
    "calm": ([0xFBFCFE, 0x2A3147, 0x6B7390, 0xC9738B, 0xF6E3E9, 0x5F9274, 0xE1EEE6], [0x202535, 0xE9ECF4, 0x9AA2BC, 0xE7A3B6, 0x3A2C37, 0x9CC4AB, 0x26352F]),
    "calmBaby": ([0xFCFBFE, 0x33304A, 0x77728F, 0xD98270, 0xF7E4DF, 0x5E86B8, 0xE2EAF4], [0x232238, 0xECEAF4, 0xA29EBB, 0xF0A595, 0x3D2B2C, 0xA3BEDF, 0x253244]),
    "bloom": ([0xFFFFFF, 0x2F4A2C, 0x6B8466, 0xD4637F, 0xFBE3E8, 0x4F8A4A, 0xDDEDD3], [0x22301F, 0xE8F1E2, 0xA7BDA0, 0xF08FA6, 0x45262F, 0x92C98A, 0x24391F]),
    "nest": ([0xFFFBF5, 0x5A3F2C, 0x8F7360, 0xC46A4B, 0xF8DFD2, 0x55794A, 0xDCE8D2], [0x2E241C, 0xF4E9DE, 0xC2AA96, 0xEB967A, 0x4A2D22, 0x9EC28F, 0x26341F]),
    "sky": ([0xFFFFFF, 0x1E3A5C, 0x5B7593, 0xE8784A, 0xFFE3D3, 0x2F86C2, 0xD9EEFB], [0x2A2F66, 0xF3EEFF, 0xB9B6E8, 0xFFE7A3, 0x3A3A6E, 0xC7B8FF, 0x34386F]),
    "storybook": ([0xFFFFFF, 0x30507A, 0x6A84A6, 0xE8708F, 0xFDE3EA, 0x3F9C74, 0xDDF3E8], [0x213049, 0xE6EFFA, 0x9FB3CE, 0xF59AB2, 0x45293A, 0x86D1AE, 0x1F3B33]),
    "friend": ([0xFFFFFF, 0x6A3B2A, 0x9B6E5C, 0xD9603F, 0xFFD3C2, 0x3E7A3A, 0xD3EBCD], [0x382720, 0xF8E6DC, 0xC9A595, 0xF58E70, 0x4D2A20, 0x93C98D, 0x24381F]),
  ]

  static func forLook(_ look: String, born: Bool, at date: Date) -> Pal {
    let key = look == "calm" && born ? "calmBaby" : (table[look] == nil ? "calm" : look)
    let (l, d) = table[key]!
    func col(_ i: Int) -> Color {
      if key == "sky" {
        let h = Calendar.current.component(.hour, from: date)
        return Color(UIColor(hex: (h < 6 || h >= 19) ? d[i] : l[i]))
      }
      return .dyn(l[i], d[i])
    }
    let design: Font.Design = key == "calm" || key == "calmBaby" || key == "bloom" ? .serif : .rounded
    return Pal(ink: col(1), muted: col(2), rose: col(3), roseSoft: col(4), sage: col(5), sageSoft: col(6), surface: col(0),
               radius: key.hasPrefix("calm") ? 16 : 20, numberDesign: design)
  }
}

extension UIColor {
  convenience init(hex: UInt32) {
    self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
  }
}

struct Tile: View {
  let num: Int
  let label: String
  let soft: Color
  let strong: Color
  let size: CGFloat
  let p: Pal
  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("\(num)")
        .font(.system(size: size, weight: p.numberDesign == .rounded ? .bold : .regular, design: p.numberDesign))
        .foregroundStyle(strong)
        .minimumScaleFactor(0.6)
        .lineLimit(1)
        .monospacedDigit()
      Text(label)
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .foregroundStyle(p.muted)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(10)
    .background(soft, in: RoundedRectangle(cornerRadius: p.radius, style: .continuous))
  }
}

struct WidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: Entry

  var body: some View {
    let n = entry.n
    let p = Pal.forLook(n.look, born: n.born, at: entry.date)
    switch family {
    case .accessoryInline:
      Text(n.inline)
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        VStack(spacing: 0) {
          Text("\(n.leftNum)").font(.system(size: 20, weight: .bold, design: .rounded)).minimumScaleFactor(0.6)
          Text(n.leftShort).font(.system(size: 10, weight: .semibold, design: .rounded))
        }
      }
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text("\(n.leftNum)").font(.system(size: 22, weight: .bold, design: .rounded))
          Text(n.leftShort).font(.system(size: 12, weight: .semibold, design: .rounded))
          Spacer().frame(width: 8)
          Text("\(n.rightNum)").font(.system(size: 22, weight: .bold, design: .rounded))
          Text(n.rightShort).font(.system(size: 12, weight: .semibold, design: .rounded))
        }
        Text(n.joy).font(.system(size: 11, design: .rounded)).lineLimit(2)
      }
    case .systemSmall:
      VStack(alignment: .leading, spacing: 6) {
        HStack {
          Text(entry.date, format: .dateTime.weekday(.abbreviated).day())
          Spacer()
          Text(n.tag).foregroundStyle(p.rose)
        }
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .foregroundStyle(p.muted)
        Tile(num: n.leftNum, label: n.leftLabel, soft: p.roseSoft, strong: p.rose, size: 30, p: p)
        Tile(num: n.rightNum, label: n.rightLabel, soft: p.sageSoft, strong: p.sage, size: 22, p: p)
      }
    default:
      VStack(alignment: .leading, spacing: 8) {
        HStack {
          Text(entry.date, format: .dateTime.weekday(.wide).month(.abbreviated).day())
          Spacer()
          Text(n.tag).foregroundStyle(p.rose)
        }
        .font(.system(size: 12, weight: .semibold, design: .rounded))
        .foregroundStyle(p.muted)
        HStack(spacing: 8) {
          Tile(num: n.leftNum, label: n.leftLabel, soft: p.roseSoft, strong: p.rose, size: 36, p: p)
          Tile(num: n.rightNum, label: n.rightLabel, soft: p.sageSoft, strong: p.sage, size: 36, p: p)
        }
        Text(n.isExample ? "Open Little Countdown to add your dates." : "Today: \(n.joy)")
          .font(.system(size: 12, weight: .medium, design: .rounded))
          .foregroundStyle(p.ink)
          .lineLimit(2)
      }
    }
  }
}

struct LittleCountdownWidget: Widget {
  let kind = "LittleCountdownWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      WidgetView(entry: entry)
        .containerBackground(Pal.forLook(entry.n.look, born: entry.n.born, at: entry.date).surface, for: .widget)
    }
    .configurationDisplayName("Little Countdown")
    .description("Days to baby and to maternity leave, with today's little joy.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryCircular, .accessoryInline])
  }
}

@main
struct LittleCountdownWidgets: WidgetBundle {
  var body: some Widget {
    LittleCountdownWidget()
  }
}
