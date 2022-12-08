FROM espressif/idf:v4.4.3

# We use this label as a filter when cleaning our runners disk space up with docker-prune
LABEL protected="true"

ADD . /home/idf-web-ide/

ARG DEBIAN_FRONTEND=noninteractive
RUN useradd -m iwiuser

# To install dependencies
RUN apt-get update \
  && apt-get install -y -q ca-certificates \
  && curl -sL https://deb.nodesource.com/setup_16.x | bash \
  && apt install -y -q \
  g++ \
  git \
  libglib2.0-0 \
  libnuma1 \
  libpixman-1-0 \
  libsecret-1-dev \
  make \
  nodejs \
  pkgconf \
  && npm install -g yarn typescript \
  && rm -rf /var/lib/apt/lists/*

RUN cd /home/idf-web-ide/ && yarn

RUN chmod g+rw /home && \
  chmod g+rw /opt/esp && \
  mkdir /home/projects && \
  chown -R iwiuser:iwiuser /home/idf-web-ide && \
  chown -R iwiuser:iwiuser /home/projects

WORKDIR /home/idf-web-ide/browser-app/

ENV SHELL /bin/bash
ENV WEB_IDE=1
ENV PROJECT_DIR=/home/iwiuser/templates
ENV IWI_PORT 8000
ENV THEIA_WEBVIEW_EXTERNAL_ENDPOINT={{hostname}}

# QEMU
ENV QEMU_REL=esp-develop-20220919
ENV QEMU_SHA256=f6565d3f0d1e463a63a7f81aec94cce62df662bd42fc7606de4b4418ed55f870
ENV QEMU_DIST=qemu-${QEMU_REL}.tar.bz2
ENV QEMU_URL=https://github.com/espressif/qemu/releases/download/${QEMU_REL}/${QEMU_DIST}

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV IDF_PYTHON_ENV_PATH=/opt/esp/python_env/idf4.4_py3.8_env

RUN wget --no-verbose ${QEMU_URL} \
  && echo "${QEMU_SHA256} *${QEMU_DIST}" | sha256sum --check --strict - \
  && tar -xf $QEMU_DIST -C /opt \
  && rm ${QEMU_DIST}

ENV PATH=/opt/qemu/bin:${PATH}

RUN git config --global --add safe.directory /opt/esp/idf

RUN echo "source /opt/esp/idf/export.sh > /dev/null 2>&1" >> ~/.bashrc

RUN ${IDF_PYTHON_ENV_PATH}/bin/python -m pip install -r /home/idf-web-ide/vscode-extensions/espressif.esp-idf-extension/extension/requirements.txt
RUN ${IDF_PYTHON_ENV_PATH}/bin/python -m pip install -r /home/idf-web-ide/vscode-extensions/espressif.esp-idf-extension/extension/esp_debug_adapter/requirements.txt

EXPOSE ${IWI_PORT}

USER iwiuser

CMD yarn start:debug ${PROJECT_DIR} --hostname=0.0.0.0 --port ${IWI_PORT}
ENTRYPOINT [ "/opt/esp/entrypoint.sh" ]
