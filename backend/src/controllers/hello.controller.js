const getHello = (req, res) => {
  res.json({ message: "Hello from backend" });
};

module.exports = { getHello };
