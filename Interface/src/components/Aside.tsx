//@ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link"; // Use Link instead of <a> for better routing
import { usePathname } from "next/navigation";
import { GrCatalog } from "react-icons/gr";
import { CiCreditCard1, CiCalendarDate, CiUser } from "react-icons/ci";
import { LuPackage } from "react-icons/lu";
import { FaUserCircle } from "react-icons/fa";
import Spinner from "./Spinner";
import { UserAuth } from "@/app/context/AuthContext";
import Image from "next/image";

export default function Aside() {
  const { user, logOut } = UserAuth();
  const [loading, setLoading] = useState(false);

  const currentRoute = usePathname();
  const routes = [
    { route: "/dashboard/projects", icon: <GrCatalog />, name: "Projects" },
    {
      route: "/dashboard/active-projects",
      icon: <LuPackage />,
      name: "Active Projects",
    },
    { route: "/dashboard/visualizer", icon: <CiUser />, name: "Visualizer" },
    // { route: "/dashboard/cleaner", icon: <CiCreditCard1 />, name: "Cleaner" },
    // {
    //   route: "/chat-with-data",
    //   icon: <CiCalendarDate />,
    //   name: "Chat with data",
    // },
  ];

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logOut();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 flex h-screen flex-col justify-start py-6 px-4 shadow-xl border-r border-gray-700">
      <div className="space-y-8">
        <div className="w-full flex justify-center items-center">
          <div className="hover:opacity-90 transition-opacity">
            <Image
              src="/icon.png"
              width={120}
              height={70}
              alt="logo"
              className="drop-shadow-lg"
            />
          </div>
        </div>
        <div className="pb-2">
          <hr className="border-gray-600" />
        </div>

        <nav className="flex gap-2 flex-col">
          {routes.map((route, index) => (
            <Link href={route.route} key={`route-${index}`}>
              <div
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
                  currentRoute === route.route
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <span
                  className={`text-xl ${
                    currentRoute === route.route ? "drop-shadow-lg" : ""
                  }`}
                >
                  {route.icon}
                </span>
                <span
                  className={`text-[15px] font-medium ${
                    currentRoute === route.route ? "font-semibold" : ""
                  }`}
                >
                  {route.name}
                </span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto">
        {loading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : user ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="w-full">
              <hr className="border-gray-600" />
            </div>
            <div className="flex flex-col items-center gap-3 w-full p-4 rounded-xl bg-gray-800/50">
              <FaUserCircle className="text-gray-200 text-4xl" />
              <p className="text-gray-200 font-medium text-sm">
                {user?.displayName}
              </p>
              <button
                className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
                onClick={handleSignOut}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-center font-medium shadow-lg shadow-indigo-500/30"
          >
            Login
          </Link>
        )}
      </div>
    </aside>
  );
}
