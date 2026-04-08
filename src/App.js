import { useState } from "react";

function reduceToSingle(n) {
  while (n > 9) {
    n = n.toString().split("").reduce((a, b) => a + Number(b), 0);
  }
  return n === 0 ? 9 : n;
}

function getRoot(day) {
  return reduceToSingle(day);
}

function getDestiny(dob) {
  const digits = dob.replace(/-/g, "").split("").map(Number);
  return reduceToSingle(digits.reduce((a, b) => a + b, 0));
}

function getGridNumbers(dob, root, destiny) {
  const [dd, mm, yyyy] = dob.split("-");
  const yy = yyyy.slice(2);

  let digits = (dd + mm + yy)
      .split("")
      .filter((d) => d !== "0")
      .map(Number);

  digits.push(root);
  digits.push(destiny);

  const counts = {};
  for (let i = 1; i <= 9; i++) counts[i] = [];

  digits.forEach((d) => counts[d].push(d));

  return counts;
}

function getBasicGrid(dob, root, destiny) {
  const [dd, mm, yyyy] = dob.split("-");
  const yy = yyyy.slice(2);

  // Extract all digits from DD-MM-YY (excluding 0s)
  let digits = (dd + mm + yy)
    .split("")
    .filter((d) => d !== "0")
    .map(Number);

  // Check if root equals the birth date (day number)
  const dayNumber = Number(dd);

  // If root != dayNumber, add root to digits
  if (root !== dayNumber) {
    digits.push(root);
  }

  // Always add destiny
  digits.push(destiny);

  // Create grid counts - positions: 3,1,9,6,7,5,2,8,4
  const counts = {};
  for (let i = 1; i <= 9; i++) counts[i] = [];

  // Add each digit to its corresponding position in the grid
  digits.forEach((d) => counts[d].push(d));

  return counts;
}

function getWeekdayNumber(date) {
  const map = { 0: 1, 1: 2, 2: 9, 3: 5, 4: 3, 5: 6, 6: 8 };
  return map[date.getDay()];
}

function getAntardasha(year, dob, root) {
  const [dd, mm] = dob.split("-");
  const lastTwo = year % 100;
  const month = Number(mm);

  const birthday = new Date(year, month - 1, Number(dd));
  const weekdayNumber = getWeekdayNumber(birthday);

  let total = lastTwo + root + month + weekdayNumber;
  return reduceToSingle(total);
}

function getMahadasha(year, dob, root) {
  const [dd, mm, yyyy] = dob.split("-").map(Number);

  let current = root;
  let start = new Date(yyyy, mm - 1, dd);

  while (true) {
    let end = new Date(start);
    end.setFullYear(start.getFullYear() + current);
    end.setDate(end.getDate() - 1);

    if (year >= start.getFullYear() && year <= end.getFullYear()) {
      return current;
    }

    start = new Date(end);
    start.setDate(start.getDate() + 1);
    current = current === 9 ? 1 : current + 1;
  }
}

function getPratyantarRanges(year, dob, antara) {
  const [dd, mm] = dob.split("-").map(Number);

  let start = new Date(year, mm - 1, dd);
  let sequence = [];

  let current = antara;
  for (let i = 0; i < 9; i++) {
    sequence.push(current);
    current = current === 9 ? 1 : current + 1;
  }

  let ranges = [];

  sequence.forEach((p) => {
    let days = p * 8;
    let end = new Date(start);
    end.setDate(start.getDate() + days - 1);

    ranges.push({ p, start: new Date(start), end });

    start = new Date(end);
    start.setDate(start.getDate() + 1);
  });

  return ranges;
}

function formatDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  });
}

function Grid({ counts, root, destiny, maha, antara, praty }) {
  const getStyle = (type) => {
    switch (type) {
      case "R": return "text-blue-600 font-bold";
      case "D": return "text-purple-600 font-bold";
      case "M": return "text-yellow-600 font-bold";
      case "A": return "text-green-600 font-bold";
      case "P": return "text-red-600 font-bold";
      default: return "";
    }
  };

  const cell = (num) => {
    let arr = [...counts[num]];

    let elements = [];
    let usedR = false;
    let usedD = false;

    arr.forEach((n, i) => {
      if (n === root && !usedR) {
        elements.push(<span key={i} className={getStyle("R")}>{n}(R)</span>);
        usedR = true;
      } else if (n === destiny && !usedD) {
        elements.push(<span key={i} className={getStyle("D")}>{n}(D)</span>);
        usedD = true;
      } else {
        elements.push(<span key={i}>{n}</span>);
      }
    });

    if (!usedR && root === num) {
      elements.push(<span key="r" className={getStyle("R")}>{num}(R)</span>);
    }

    if (!usedD && destiny === num) {
      elements.push(<span key="d" className={getStyle("D")}>{num}(D)</span>);
    }

    if (maha === num) {
      elements.push(<span key="m" className={getStyle("M")}>{num}(M)</span>);
    }

    if (antara === num) {
      elements.push(<span key="a" className={getStyle("A")}>{num}(A)</span>);
    }

    if (praty === num) {
      elements.push(<span key="p" className={getStyle("P")}>{num}(P)</span>);
    }

    return elements.length ? elements.map((el, i) => <div key={i}>{el}</div>) : "-";
  };

  return (
      <div className="grid grid-cols-3 gap-2 w-64 text-center">
        {[3,1,9,6,7,5,2,8,4].map((n, i) => (
            <div key={i} className="border p-4 rounded-2xl shadow bg-white min-h-[80px] flex items-center justify-center">
              <div>{cell(n)}</div>
            </div>
        ))}
      </div>
  );
}

export default function App() {
  const [dob, setDob] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");

  const formatDOB = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, "");

    // Only allow up to 8 digits (DDMMYYYY)
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return cleaned.slice(0, 2) + "-" + cleaned.slice(2);
    return cleaned.slice(0, 2) + "-" + cleaned.slice(2, 4) + "-" + cleaned.slice(4, 8);
  };

  const handleDOBChange = (e) => {
    const formatted = formatDOB(e.target.value);
    setDob(formatted);
  };

  const isValidDOB = (dateStr) => {
    if (!dateStr) return false;

    const parts = dateStr.split("-");
    if (parts.length !== 3) return false;
    if (parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) return false;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validate month
    if (month < 1 || month > 12) return false;

    // Validate day
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Check for leap year
    if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
      daysInMonth[1] = 29;
    }

    if (day < 1 || day > daysInMonth[month - 1]) return false;

    return true;
  };

  const handleSubmit = () => {
    setError("");

    if (!dob || !startYear || !endYear) {
      setError("Please enter all values: DOB, Start Year, and End Year");
      return;
    }

    if (!isValidDOB(dob)) {
      setError("Invalid DOB. Please enter in format DD-MM-YYYY (e.g., 12-05-1986)");
      return;
    }

    const start = parseInt(startYear, 10);
    const end = parseInt(endYear, 10);

    if (isNaN(start) || isNaN(end)) {
      setError("Please enter valid year values");
      return;
    }

    if (start > end) {
      setError("Start Year must be less than or equal to End Year");
      return;
    }

    setShowResults(true);
  };

  let root = null;
  let destiny = null;
  let baseCounts = null;
  let basicCounts = null;
  let years = [];

  if (showResults && isValidDOB(dob) && startYear && endYear) {
    try {
      const [dd] = dob.split("-");
      root = getRoot(Number(dd));
      destiny = getDestiny(dob);
      baseCounts = getGridNumbers(dob, root, destiny);
      basicCounts = getBasicGrid(dob, root, destiny);

      const start = parseInt(startYear, 10);
      const end = parseInt(endYear, 10);
      for (let y = start; y <= end; y++) {
        years.push(y);
      }
    } catch (e) {
      setError("Error processing data. Please check your input.");
      setShowResults(false);
      return;
    }
  }

  return (
      <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold">Vedic Numerology Dashboard</h1>

        <div className="bg-white p-6 rounded shadow">
          <div className="flex gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">DOB</label>
              <input
                value={dob}
                onChange={handleDOBChange}
                className="border-2 border-blue-300 bg-blue-50 p-2 rounded focus:outline-none focus:border-blue-500"
                placeholder="DDMMYYYY"
                maxLength="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Year</label>
              <input
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="border-2 border-blue-300 bg-blue-50 p-2 rounded focus:outline-none focus:border-blue-500"
                placeholder="Start Year"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Year</label>
              <input
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="border-2 border-blue-300 bg-blue-50 p-2 rounded focus:outline-none focus:border-blue-500"
                placeholder="End Year"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition-colors"
            >
              Calculate
            </button>
          </div>
          {error && <p className="text-red-500 font-semibold">{error}</p>}
        </div>

        {showResults && root !== null && destiny !== null && basicCounts && (
          <>
            <div className="bg-white p-4 rounded shadow">
              <p><b>Root (R):</b> {root}</p>
              <p><b>Destiny (D):</b> {destiny}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Basic Grid (DOB Only)</h2>
              <Grid counts={basicCounts} />
            </div>

            {years.map((year) => {
              const maha = getMahadasha(year, dob, root);
              const antara = getAntardasha(year, dob, root);
              const ranges = getPratyantarRanges(year, dob, antara);

              return (
                  <div key={year} className="space-y-4">
                    <h2 className="text-2xl font-bold">Year: {year}</h2>

                    <div className="bg-white p-4 rounded shadow">
                      <p><b>Mahadasha (M):</b> {maha}</p>
                      <p><b>Antardasha (A):</b> {antara}</p>
                    </div>

                    <h3 className="text-lg font-semibold">Base Grid</h3>
                    <Grid counts={baseCounts} root={root} destiny={destiny} maha={maha} antara={antara} />

                    <div className="grid grid-cols-3 gap-6">
                      {ranges.map((item, i) => (
                          <div key={i} className="bg-white p-4 rounded shadow">
                            <p className="font-bold mb-1">{formatDate(item.start)} – {formatDate(item.end)}</p>
                            <p className="font-semibold mb-2">P = {item.p}</p>
                            <Grid
                                counts={baseCounts}
                                root={root}
                                destiny={destiny}
                                maha={maha}
                                antara={antara}
                                praty={item.p}
                            />
                          </div>
                      ))}
                    </div>
                  </div>
              );
            })}
          </>
        )}
      </div>
  );
}