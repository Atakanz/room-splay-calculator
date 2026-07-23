FROM node:20-slim

# C++, Fortran ve CHOLMOD kütüphaneleri
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libsuitesparse-dev \
    libblas-dev \
    liblapack-dev \
    build-essential \
    gfortran \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]