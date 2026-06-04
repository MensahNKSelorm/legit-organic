import type { Metadata } from "next";
import SectionWrapper from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "My Profile",
};

export default function ProfilePage() {
  return (
    <>
      <div style={{ backgroundColor: "#0D3B2A", paddingTop: "8rem", paddingBottom: "4rem" }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-mist-white">My Profile</h1>
          <p className="text-light-leaf mt-2 text-lg">Manage your account details and preferences</p>
        </div>
      </div>

      <SectionWrapper background="cream">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="bg-mist-white rounded-2xl p-6 border border-sand h-fit">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-leaf-green/20 flex items-center justify-center text-leaf-green text-3xl font-bold font-display mb-3">
                K
              </div>
              <p className="font-semibold text-forest-green">Kwame Asante</p>
              <p className="text-charcoal/60 text-sm">kwame@example.com</p>
            </div>
            <nav className="space-y-1">
              {["Account Details", "Saved Addresses", "My Recipes", "Notifications", "Security"].map(
                (item) => (
                  <button
                    key={item}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-charcoal/70 hover:bg-beige hover:text-forest-green transition-colors"
                  >
                    {item}
                  </button>
                )
              )}
            </nav>
          </div>

          {/* Main */}
          <div className="md:col-span-2 bg-mist-white rounded-2xl p-8 border border-sand">
            <h2 className="font-display text-xl font-bold text-forest-green mb-6">
              Account Details
            </h2>
            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Kwame"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Asante"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="kwame@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-ghana-gold text-forest-green font-semibold px-8 py-3 rounded-xl hover:bg-dark-gold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
