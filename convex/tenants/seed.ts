import { mutation } from "../_generated/server";

export const seedDemoContent = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", "demo-media"))
      .unique();

    if (!existingTenant) {
      await ctx.db.insert("tenants", {
        slug: "demo-media",
        name: "Demo Media",
        theme: {
          primary: "#101828",
          accent: "#B42318",
          background: "#FCFCFD",
          foreground: "#101828",
        },
        enabledModules: ["articles", "episodes", "videos", "premium"],
      });
    }
  },
});
