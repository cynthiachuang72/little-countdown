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
}

struct Numbers {
  var babyDays: Int
  var leaveDays: Int
  var workdays: Int
  var week: Int
  var joy: String
  var isExample: Bool
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

  return Numbers(babyDays: max(0, days(today, due)), leaveDays: max(0, days(today, leave)),
                 workdays: workdays, week: week, joy: joy, isExample: snap == nil)
}

// MARK: - Timeline

struct Entry: TimelineEntry {
  let date: Date
  let n: Numbers
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry {
    Entry(date: .now, n: Numbers(babyDays: 132, leaveDays: 116, workdays: 76, week: 21, joy: "Plan one more date night before baby arrives.", isExample: true))
  }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : Entry(date: .now, n: numbers(on: .now)))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    // One entry for now and one for each of the next few midnights, then ask again.
    let cal = Calendar.current
    var entries = [Entry(date: .now, n: numbers(on: .now))]
    var next = cal.startOfDay(for: .now)
    for _ in 0..<3 {
      next = cal.date(byAdding: .day, value: 1, to: next)!
      entries.append(Entry(date: next, n: numbers(on: next)))
    }
    completion(Timeline(entries: entries, policy: .after(next)))
  }
}

// MARK: - Look

extension Color {
  static func dyn(_ light: UInt32, _ dark: UInt32) -> Color {
    Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
  }
  static let ink = dyn(0x2A3147, 0xE9ECF4)
  static let muted = dyn(0x6B7390, 0x9AA2BC)
  static let rose = dyn(0xC9738B, 0xE7A3B6)
  static let roseSoft = dyn(0xF6E3E9, 0x3A2C37)
  static let sage = dyn(0x5F9274, 0x9CC4AB)
  static let sageSoft = dyn(0xE1EEE6, 0x26352F)
  static let surface = dyn(0xFBFCFE, 0x202535)
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
  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("\(num)")
        .font(.system(size: size, weight: .regular, design: .serif))
        .foregroundStyle(strong)
        .minimumScaleFactor(0.6)
        .lineLimit(1)
        .monospacedDigit()
      Text(label)
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .foregroundStyle(Color.muted)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(10)
    .background(soft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
  }
}

struct WidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: Entry

  var body: some View {
    let n = entry.n
    switch family {
    case .accessoryInline:
      Text("\(n.babyDays) days to baby · \(n.leaveDays) to leave")
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        VStack(spacing: 0) {
          Text("\(n.babyDays)").font(.system(size: 20, weight: .bold, design: .rounded)).minimumScaleFactor(0.6)
          Text("baby").font(.system(size: 10, weight: .semibold, design: .rounded))
        }
      }
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text("\(n.babyDays)").font(.system(size: 22, weight: .bold, design: .rounded))
          Text("baby").font(.system(size: 12, weight: .semibold, design: .rounded))
          Spacer().frame(width: 8)
          Text("\(n.leaveDays)").font(.system(size: 22, weight: .bold, design: .rounded))
          Text("leave").font(.system(size: 12, weight: .semibold, design: .rounded))
        }
        Text(n.joy).font(.system(size: 11, design: .rounded)).lineLimit(2)
      }
    case .systemSmall:
      VStack(alignment: .leading, spacing: 6) {
        HStack {
          Text(entry.date, format: .dateTime.weekday(.abbreviated).day())
          Spacer()
          Text("Wk \(n.week)").foregroundStyle(Color.rose)
        }
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .foregroundStyle(Color.muted)
        Tile(num: n.babyDays, label: "days to baby", soft: .roseSoft, strong: .rose, size: 30)
        Tile(num: n.leaveDays, label: "\(n.workdays) workdays left", soft: .sageSoft, strong: .sage, size: 22)
      }
    default:
      VStack(alignment: .leading, spacing: 8) {
        HStack {
          Text(entry.date, format: .dateTime.weekday(.wide).month(.abbreviated).day())
          Spacer()
          Text("Week \(n.week)").foregroundStyle(Color.rose)
        }
        .font(.system(size: 12, weight: .semibold, design: .rounded))
        .foregroundStyle(Color.muted)
        HStack(spacing: 8) {
          Tile(num: n.babyDays, label: n.babyDays == 1 ? "day to baby" : "days to baby", soft: .roseSoft, strong: .rose, size: 36)
          Tile(num: n.leaveDays, label: "\(n.workdays) workdays to leave", soft: .sageSoft, strong: .sage, size: 36)
        }
        Text(n.isExample ? "Open Little Countdown to add your dates." : "Today: \(n.joy)")
          .font(.system(size: 12, weight: .medium, design: .rounded))
          .foregroundStyle(Color.ink)
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
        .containerBackground(Color.surface, for: .widget)
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
