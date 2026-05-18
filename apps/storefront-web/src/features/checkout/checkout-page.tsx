import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useCart } from '../cart/cart-context';
import { endOfMonthFromYearMonth } from '../../lib/date-month';
import { useAccessToken, useBuyerSub } from '../../lib/use-access-token';
import {
  fetchCardTypes,
  fetchMyOrders,
  postDraft,
  postSubmitOrder,
} from '../../lib/ordering-api';
import { useStorefrontUi } from '../../layout/storefront-ui-context';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, dispatch, totalPrice } = useCart();
  const { setHeaderTitle, setHeaderSubtitle } = useStorefrontUi();
  const tokenForApi = useAccessToken();
  const buyerSub = useBuyerSub();

  const [userName, setUserName] = useState('Alice Smith');
  const [city, setCity] = useState('Seattle');
  const [street, setStreet] = useState('15703 NE 61st Ct');
  const [stateVal, setStateVal] = useState('WA');
  const [country, setCountry] = useState('United States');
  const [zipCode, setZipCode] = useState('98052');
  const [cardNumber, setCardNumber] = useState('4012888888881881');
  const [cardHolderName, setCardHolderName] = useState('Alice Smith');
  const [cardMonth, setCardMonth] = useState('2030-12');
  const [cardSecurityNumber, setCardSecurityNumber] = useState('123');
  const [cardTypeId, setCardTypeId] = useState('');
  const [cardTypes, setCardTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setHeaderTitle('Checkout');
    setHeaderSubtitle('');
    document.title = 'Checkout | AdventureWorks';
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, [setHeaderSubtitle, setHeaderTitle]);

  useEffect(() => {
    if (!lines.length) void navigate('/cart', { replace: true });
  }, [lines.length, navigate]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchCardTypes(tokenForApi);
        if (!cancelled) {
          setCardTypes(list);
          setCardTypeId((prev) => prev || (list.length ? String(list[0].id) : ''));
        }
      } catch {
        if (!cancelled) setCardTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenForApi]);

  const buyerId = useMemo(() => buyerSub.trim(), [buyerSub]);

  const submitOrder = useCallback(async () => {
    setFormError(null);
    if (!lines.length) {
      setFormError('Your cart is empty');
      return;
    }
    if (!buyerId.length) {
      setFormError('Sign in to place an order.');
      return;
    }
    if (!cardTypeId) {
      setFormError('Pick a card type.');
      return;
    }

    setBusy(true);
    try {
      const draftItems = lines.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        unitPrice: l.unitPrice,
        pictureUrl: l.pictureUrl,
        quantity: l.quantity,
      }));

      await postDraft(tokenForApi, { buyerId, items: draftItems });

      const orderBody = {
        userId: buyerId,
        userName: userName.trim(),
        city: city.trim(),
        street: street.trim(),
        state: stateVal.trim(),
        country: country.trim(),
        zipCode: zipCode.trim(),
        cardNumber: cardNumber.trim(),
        cardHolderName: cardHolderName.trim(),
        cardExpiration: endOfMonthFromYearMonth(cardMonth),
        cardSecurityNumber: cardSecurityNumber.trim(),
        cardTypeId: Number(cardTypeId),
        items: draftItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          unitPrice: i.unitPrice,
          pictureUrl: i.pictureUrl,
          quantity: i.quantity,
        })),
      };

      await postSubmitOrder(tokenForApi, orderBody);
      await new Promise((r) => setTimeout(r, 400));
      await fetchMyOrders(tokenForApi);
      dispatch({ type: 'clear' });
      void navigate('/user/orders', { replace: true });
    } catch (e) {
      setFormError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }, [
    lines,
    buyerId,
    cardTypeId,
    tokenForApi,
    userName,
    city,
    street,
    stateVal,
    country,
    zipCode,
    cardNumber,
    cardHolderName,
    cardMonth,
    cardSecurityNumber,
    dispatch,
    navigate,
  ]);

  if (!lines.length) {
    return null;
  }

  return (
    <div className="checkout">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            void submitOrder();
          }}
        >
          <div className="form-section">
            <h2>Shipping address</h2>
            <label>
              Address
              <input value={street} onChange={(e) => setStreet(e.target.value)} />
            </label>
            <div className="form-group">
              <div className="form-group-item">
                <label>
                  City
                  <input value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
              </div>
              <div className="form-group-item">
                <label>
                  State
                  <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
                </label>
              </div>
              <div className="form-group-item">
                <label>
                  Zip code
                  <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                </label>
              </div>
            </div>
            <label>
              Country
              <input value={country} onChange={(e) => setCountry(e.target.value)} />
            </label>
          </div>

          <div className="form-section">
            <h2>Payment</h2>
            <label>
              User name
              <input value={userName} onChange={(e) => setUserName(e.target.value)} />
            </label>
            <label>
              Card number
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
            </label>
            <label>
              Card holder
              <input value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} />
            </label>
            <div className="form-group">
              <div className="form-group-item">
                <label>
                  Expires (month)
                  <input type="month" value={cardMonth} onChange={(e) => setCardMonth(e.target.value)} />
                </label>
              </div>
              <div className="form-group-item">
                <label>
                  CVV
                  <input value={cardSecurityNumber} onChange={(e) => setCardSecurityNumber(e.target.value)} />
                </label>
              </div>
              <div className="form-group-item">
                <label>
                  Card type
                  <select value={cardTypeId} onChange={(e) => setCardTypeId(e.target.value)}>
                    {cardTypes.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <p>
              Cart total:{' '}
              <strong>{totalPrice.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</strong>
            </p>
          </div>

          {formError ? <p className="validation-message">{formError}</p> : null}

          <div className="form-section">
            <div className="form-buttons">
              <Link to="/cart" className="button button-secondary">
                <img role="presentation" src="/icons/arrow-left.svg" alt="" />
                Back to the shopping bag
              </Link>
              <button type="submit" className="button button-primary" disabled={busy}>
                {busy ? 'Placing order…' : 'Place order'}
              </button>
            </div>
          </div>
        </form>
    </div>
  );
}
