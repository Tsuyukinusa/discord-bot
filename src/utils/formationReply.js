export function formatReply(text, data = {}) {
    if (!text) return "";

    return text
        .replaceAll("{user}", data.user || "")
        .replaceAll("{mention}", data.mention || "")
        .replaceAll("{money}", data.money?.toString() || "")
        .replaceAll("{diamond}", data.diamond?.toString() || "")
        .replaceAll("{failMoney}", data.failMoney?.toString() || "")
        .replaceAll("{currency}", data.currency || "")
        .replaceAll("{guild}", data.guild || "");
}
