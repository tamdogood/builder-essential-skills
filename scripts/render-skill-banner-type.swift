import AppKit
import Foundation

private enum Alignment {
    case left
    case center
    case right
}

private struct Banner {
    let slug: String
    let subtitle: String
    let anchorX: CGFloat
    let titleTop: CGFloat
    let alignment: Alignment
}

private let banners: [Banner] = [
    .init(slug: "async-learning-teacher", subtitle: "TURN SAVED MATERIAL INTO UNDERSTANDING", anchorX: 96, titleTop: 236, alignment: .left),
    .init(slug: "build-scenario-tests", subtitle: "COMPILE BEHAVIOR INTO PROOF.", anchorX: 78, titleTop: 374, alignment: .left),
    .init(slug: "code-standards", subtitle: "MAKE SMALL CHANGES. KEEP CHECKS GREEN.", anchorX: 1530, titleTop: 310, alignment: .right),
    .init(slug: "create-marketing-kit", subtitle: "TURN PRODUCT TRUTH INTO CAMPAIGN MATERIAL.", anchorX: 86, titleTop: 374, alignment: .left),
    .init(slug: "create-skill", subtitle: "MAKE THE WORKFLOW SHIPPABLE.", anchorX: 86, titleTop: 548, alignment: .left),
    .init(slug: "lead-research", subtitle: "MAP THE DECISION BEFORE YOU BUILD", anchorX: 96, titleTop: 632, alignment: .left),
    .init(slug: "lead", subtitle: "TURN A PRODUCT GOAL INTO A SHIPPED PR", anchorX: 836, titleTop: 220, alignment: .center),
    .init(slug: "make-playbook", subtitle: "TURN THE NEXT MOVE INTO A PLAN.", anchorX: 88, titleTop: 294, alignment: .left),
    .init(slug: "map-the-landscape", subtitle: "SEE HOW THE WHOLE SYSTEM FITS TOGETHER", anchorX: 76, titleTop: 536, alignment: .left),
    .init(slug: "name-your-business", subtitle: "FIND THE NAME. VERIFY THE DOMAIN.", anchorX: 86, titleTop: 340, alignment: .left),
    .init(slug: "orwell-writing", subtitle: "WRITE PLAINLY. SAY WHAT YOU MEAN.", anchorX: 76, titleTop: 674, alignment: .left),
    .init(slug: "paper-opportunity-radar", subtitle: "FIND THE SIGNAL BURIED IN RESEARCH", anchorX: 78, titleTop: 662, alignment: .left),
    .init(slug: "repo-system-map", subtitle: "TRACE THE CODE. LEARN THE SYSTEM.", anchorX: 78, titleTop: 284, alignment: .left),
    .init(slug: "run-smoke-tests", subtitle: "AUDIT THE WHOLE JOURNEY.", anchorX: 78, titleTop: 366, alignment: .left),
    .init(slug: "session-profiler", subtitle: "SEE WHERE YOUR AGENT SPENDS TIME AND COST", anchorX: 78, titleTop: 256, alignment: .left),
    .init(slug: "top-one-percent", subtitle: "PRACTICE YOUR WAY TO MASTERY", anchorX: 78, titleTop: 648, alignment: .left),
    .init(slug: "validate-market", subtitle: "FIND OUT IF THE IDEA IS WORTH BUILDING", anchorX: 1500, titleTop: 286, alignment: .right),
    .init(slug: "write-blog", subtitle: "WRITE THE POST. SHIP IT TO THE SITE.", anchorX: 92, titleTop: 98, alignment: .left),
]

private let canvasSize = NSSize(width: 1672, height: 941)
private let titleFont = NSFont(name: "AvenirNext-Regular", size: 64)!
private let subtitleFont = NSFont(name: "AvenirNext-Medium", size: 18)!
private let titleColor = NSColor(calibratedRed: 0.91, green: 0.87, blue: 0.78, alpha: 0.96)
private let subtitleColor = NSColor(calibratedRed: 0.91, green: 0.87, blue: 0.78, alpha: 0.82)
private let titleSubtitleGap: CGFloat = 26

private func originX(anchor: CGFloat, width: CGFloat, alignment: Alignment) -> CGFloat {
    switch alignment {
    case .left: return anchor
    case .center: return anchor - width / 2
    case .right: return anchor - width
    }
}

guard CommandLine.arguments.count == 3 || CommandLine.arguments.count == 4 else {
    fputs("usage: swift scripts/render-skill-banner-type.swift <background-png-dir> <output-png-dir> [slug]\n", stderr)
    exit(2)
}

let inputDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
private let selectedSlug = CommandLine.arguments.count == 4 ? CommandLine.arguments[3] : nil
private let selectedBanners = selectedSlug == nil ? banners : banners.filter { $0.slug == selectedSlug }

if let selectedSlug, selectedBanners.isEmpty {
    fputs("unknown banner slug: \(selectedSlug)\n", stderr)
    exit(2)
}

try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

let shadow = NSShadow()
shadow.shadowColor = NSColor.black.withAlphaComponent(0.7)
shadow.shadowBlurRadius = 5
shadow.shadowOffset = NSSize(width: 0, height: -1)

for banner in selectedBanners {
    let inputURL = inputDirectory.appendingPathComponent("\(banner.slug).png")
    let outputURL = outputDirectory.appendingPathComponent("\(banner.slug).png")

    guard let background = NSImage(contentsOf: inputURL) else {
        fputs("missing or unreadable background: \(inputURL.path)\n", stderr)
        exit(1)
    }

    let image = NSImage(size: canvasSize)
    image.lockFocus()
    background.draw(
        in: NSRect(origin: .zero, size: canvasSize),
        from: NSRect(origin: .zero, size: background.size),
        operation: .copy,
        fraction: 1
    )

    let title = "/\(banner.slug)" as NSString
    let titleAttributes: [NSAttributedString.Key: Any] = [
        .font: titleFont,
        .foregroundColor: titleColor,
        .kern: 0,
        .shadow: shadow,
    ]
    let titleSize = title.size(withAttributes: titleAttributes)
    let titleOrigin = NSPoint(
        x: originX(anchor: banner.anchorX, width: titleSize.width, alignment: banner.alignment),
        y: canvasSize.height - banner.titleTop - titleSize.height
    )
    title.draw(at: titleOrigin, withAttributes: titleAttributes)

    let subtitle = banner.subtitle as NSString
    let subtitleAttributes: [NSAttributedString.Key: Any] = [
        .font: subtitleFont,
        .foregroundColor: subtitleColor,
        .kern: 5,
        .shadow: shadow,
    ]
    let subtitleSize = subtitle.size(withAttributes: subtitleAttributes)
    let subtitleTop = banner.titleTop + titleSize.height + titleSubtitleGap
    let subtitleOrigin = NSPoint(
        x: originX(anchor: banner.anchorX, width: subtitleSize.width, alignment: banner.alignment),
        y: canvasSize.height - subtitleTop - subtitleSize.height
    )
    subtitle.draw(at: subtitleOrigin, withAttributes: subtitleAttributes)

    image.unlockFocus()

    guard
        let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff),
        let png = bitmap.representation(using: .png, properties: [:])
    else {
        fputs("could not encode \(banner.slug)\n", stderr)
        exit(1)
    }

    try png.write(to: outputURL)
    print(outputURL.path)
}
