import classNames from 'classnames/bind';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { ReactComponent as ChevronDownIcon } from 'svg/chevron-down.svg';
import { ReactComponent as DroneLogo } from 'svg/logo-full.svg';
import { ReactComponent as WelcomePageIllustration } from 'svg/welcome-illustration.svg';

import css from './welcome.module.scss';

const cx = classNames.bind(css);

const parseQuery = (queryString) => {
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  return pairs.reduce((acc, pair) => {
    const [key, val] = pair.split('=');
    return {
      ...acc,
      [decodeURIComponent(key)]: decodeURIComponent(val || ''),
    };
  }, {});
};

export default function Welcome() {
  const { pathname, search } = useLocation();
  let error = null;
  switch (pathname) {
    case '/logout':
      error = <div className={cx('error')}>你已成功登出.</div>;
      break;
    case '/login/error':
      if (window.location.host === 'cloud.drone.io') {
        // special case for cloud.drone.io
        error = (
          <div className={cx('error')}>
            Drone Cloud is no longer accepting new registrations. We recommend
            {' '}
            <a href="https://docs.drone.io/server/overview/">installing Drone</a>
            {' '}
            on your own hardware, or you can try out the new
            {' '}
            <a href="https://harness.io/products/continuous-integration">Harness CI Cloud</a>
            .
          </div>
        );
      } else {
        error = (
          <div className={cx('error')}>
            {parseQuery(search)?.message ?? '登录发生错误，请再试一次'}
          </div>
        );
      }
      break;
    default:
  }
  return (
    <section className={cx('wrapper')}>
      <div className={cx('login')}>
        <div className={cx('header')}>
          <h1 className={cx('title')}>
            欢迎使用自动文档系统.
          </h1>
          {error}
          <p>你将被重定向到Git系统登录界面登录</p>
        </div>
        <a href="/login" target="_self" className={cx('btn')}>
          <span>继续</span>
          <ChevronDownIcon className={cx('chevron-right')} />
        </a>
      </div>
      <div className={cx('illustration')}>
        <WelcomePageIllustration />
      </div>
    </section>
  );
}
