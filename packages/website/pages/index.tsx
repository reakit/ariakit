import React from "react";
import { cx } from "ariakit-utils/misc";
import Link from "next/link";
import shapes from "../components/home-shapes.svg";
import Notification from "../components/notification";
import tw from "../utils/tw";

export default function Home() {
  return (
    <>
      <div className="flex justify-center p-3 sm:p-4">
        <Notification />
      </div>
      <div
        style={{ backgroundImage: `url(${shapes.src})` }}
        className={cx(
          "bg-no-repeat bg-top",
          "flex px-3 sm:px-4 md:px-8 flex-col items-center gap-8 p-5"
        )}
      >
        <div
          className={cx(
            "flex flex-col items-center gap-8 w-full max-w-5xl mt-4 sm:mt-10 md:mt-20"
          )}
        >
          <h1
            className={cx(
              "text-center text-5xl sm:text-6xl md:text-7xl",
              "tracking-[-0.035em] dark:tracking-[-0.015em]",
              "font-extrabold dark:font-bold text-transparent",
              "bg-gradient-to-br bg-clip-text",
              "from-[hsl(175_100%_35%)] to-[hsl(204_100%_35%)]",
              "dark:from-[hsl(175_100%_60%)] dark:to-[hsl(204_100%_58%)]"
            )}
          >
            Build accessible web apps with React
          </h1>
          <p className="max-w-3xl text-center text-lg text-canvas-1/70 dark:text-canvas-1-dark/70">
            Ariakit is an open source library that provides lower-level React
            components and hooks for building accessible web apps, design
            systems, and other component libraries.
          </p>
        </div>
        <div className="flex gap-4 mb-20 items-center flex-col sm:flex-row">
          <Link href="/guide/get-started">
            <a
              className={cx(
                "flex gap-2 h-12 items-center whitespace-nowrap justify-center text-lg px-8 rounded-lg",
                "text-primary-2 dark:text-primary-2-dark",
                "bg-primary-2 dark:bg-primary-2-dark",
                "hover:bg-primary-2-hover dark:hover:bg-primary-2-dark-hover",
                "shadow-lg dark:shadow-lg-dark"
              )}
            >
              Get started
            </a>
          </Link>
          <Link href="/components">
            <a
              className={tw`
              flex items-center justify-center whitespace-nowrap
              gap-2 h-12 px-8
              rounded-lg
              hover:bg-canvas-1 dark:hover:bg-canvas-4-dark
            `}
            >
              Components{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
    </>
  );
}
